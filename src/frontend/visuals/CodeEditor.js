const CodeMirror = require('codemirror');

require('../../../node_modules/codemirror/mode/javascript/javascript.js');
require('../../../node_modules/codemirror/addon/comment/comment');
require('../../../node_modules/codemirror/addon/edit/matchbrackets');
require('../../../node_modules/codemirror/addon/edit/closebrackets');

module.exports = function() {
  for (let i = 0; i < 2; i++) {
    const id = i == 0 ? 'main-editor' : 'secondary-editor';
    console.log(document.getElementById(id));
    const codeEditor = CodeMirror.fromTextArea(document.getElementById(id), {
      value: '// Code here',
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      theme: 'monokai',
      mode: 'javascript'
    });

    codeEditor.setOption("extraKeys", {
      Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces);
      }
    });

    console.log(codeEditor);
  }
}