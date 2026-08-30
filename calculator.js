(function () {
  'use strict';

  const form = document.getElementById('meshCalculator');
  if (!form) return;

  const widthInput = document.getElementById('stitchWidth');
  const heightInput = document.getElementById('stitchHeight');
  const meshInput = document.getElementById('meshCount');
  const sizeOutput = document.getElementById('finishedSize');
  const canvasOutput = document.getElementById('canvasSize');

  function readable(value) {
    return Number(value.toFixed(2)).toString();
  }

  function update() {
    const width = Math.max(1, Number(widthInput.value) || 1);
    const height = Math.max(1, Number(heightInput.value) || 1);
    const mesh = Math.max(1, Number(meshInput.value) || 1);
    const finishedWidth = width / mesh;
    const finishedHeight = height / mesh;

    sizeOutput.textContent = `${readable(finishedWidth)} × ${readable(finishedHeight)} in`;
    canvasOutput.textContent = `Allow at least ${readable(finishedWidth + 4)} × ${readable(finishedHeight + 4)} inches of canvas for a 2-inch working margin on every side.`;
  }

  form.addEventListener('input', update);
  update();
})();
