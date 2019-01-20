const CodeMirror = require('codemirror');

require('../../../node_modules/codemirror/mode/javascript/javascript.js');
require('../../../node_modules/codemirror/addon/comment/comment');
require('../../../node_modules/codemirror/addon/edit/matchbrackets');
require('../../../node_modules/codemirror/addon/edit/closebrackets');

module.exports = function() {
  const editors = [];
  const headers = [];
  const saveLocation = {};
  for (let i = 0; i < 3; i++) {
    const id = 'editor-'+(['one', 'two', 'three'])[i];
    const codeEditor = CodeMirror.fromTextArea(document.getElementById(id), {
      value: '// Code here',
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      theme: 'monokai',
      mode: 'javascript'
    });

    editors[i] = codeEditor;

    codeEditor.on('changes', () => {
      codeEditor.getWrapperElement().classList.add('unsaved');
    });

    const header = document.createElement('div');
    header.classList.add('header');
    codeEditor.getWrapperElement().appendChild(header);

    headers[i] = header;

    codeEditor.setOption("extraKeys", {
      Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces);
      },
      'Cmd-S': () => save(i),
      'Cntrl-S': () => save(i)
    });

    editors[i].getWrapperElement().style.display = 'none';
  }

  function save(i) {
    const codeEditor = editors[i];
    codeEditor.getWrapperElement().classList.remove('unsaved');
    if (saveLocation[i]) {
      saveLocation[i][0][saveLocation[i][1]] = codeEditor.getValue();
      if (saveLocation[i][2]) {
        const errors = saveLocation[i][2]();
        if  (errors.length > 0) {
          errors.forEach(e => console.error(e));
          codeEditor.getWrapperElement().classList.add('error');
        } else {
          codeEditor.getWrapperElement().classList.remove('error');
        }
      }
    }
  }

  function markSaved(i) {
    editors[i].getWrapperElement().classList.remove('unsaved');
  }

  function setSaveLocation(index, obj, key, cb) {
    saveLocation[index] = [obj, key, cb];
    editors[index].getWrapperElement().style.display = '';
  }

  function hide(index) {
    editors[index].getWrapperElement().style.display = 'none';
  }

  function setHeaderText(index, text) {
    headers[index].innerText = text;
  }

  return {
    editors, markSaved, setSaveLocation, hide, setHeaderText
  };
}