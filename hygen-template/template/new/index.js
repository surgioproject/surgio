'use strict';

module.exports = {
  prompt: ({ prompter: inquirer }) => {
    return inquirer
      .prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Template 名称',
        },
      ]);
  }
};
