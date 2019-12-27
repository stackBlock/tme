const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const render = require("./render");
const log = console.log;

const forbiddenDirs = ["node_modules"];

class Runner {
  constructor() {
    this.testFiles = [];
  }

  async runTests() {
    for (let file of this.testFiles) {
      log(chalk.gray(`---- ${file.shortName}`));
      const beforeEaches = [];
      global.render = render;
      global.beforeEach = fn => {
        beforeEaches.push(fn);
      };
      global.it = async (desc, fn) => {
        beforeEaches.forEach(func => func());
        try {
          await fn();
          log(chalk.blue(`\tOK - ${desc}`));
        } catch (err) {
          const message = err.message.replace(/\n/g, "\n\t\t");
          log(chalk.red(`\tX - ${desc}`));
          log(chalk.red("\t", message));
        }
      };
      try {
        require(file.name);
      } catch (err) {
        log(chalk.red(err), `In File:`, file);
      }
    }
  }

  async collectFiles(targetPath) {
    const files = await fs.promises.readdir(targetPath);

    for (let file of files) {
      const filepath = path.join(targetPath, file);
      const stats = await fs.promises.lstat(filepath);

      if (stats.isFile() && file.includes(".test.js")) {
        this.testFiles.push({ name: filepath, shortName: file });
      } else if (stats.isDirectory() && !forbiddenDirs.includes(file)) {
        const childFiles = await fs.promises.readdir(filepath);
        // below map adds the file that we are looking into
        files.push(...childFiles.map(f => path.join(file, f)));
      }
    }
  }
}

module.exports = Runner;
