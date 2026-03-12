(function() {
  // ===== i18n =====
  const i18n = {
    ja: {
      title: 'テキスト・エンティティ抽出ツール',
      subtitle: '表データの列からハッシュタグ・メンション・URL・メールアドレス・電話番号を正規表現で抽出します',
      step1: 'データ入力',
      step2: 'プレビュー',
      step3: '抽出設定・結果',
      dataInput: 'データ入力',
      hasHeader: '1行目を列名（ヘッダー）として扱う',
      fileUpload: 'ファイルアップロード',
      textPaste: 'テキスト貼り付け',
      dropZone: 'CSVファイルをドラッグ&ドロップ<br>または クリックして選択',
      textPlaceholder: 'CSV/TSVデータをここに貼り付けてください\n\n例:\nid,text\n1,こんにちは #挨拶 @user1\n2,詳細は https://example.com をご覧ください',
      loadBtn: '読み込んでプレビュー →',
      dataPreview: 'データプレビュー',
      backToInput: '← データ入力に戻る',
      goToExtract: '抽出設定へ →',
      extractSettings: '抽出設定',
      targetCol: '対象列:',
      extractType: '抽出タイプ:',
      type_hashtag: 'ハッシュタグ',
      type_mention: 'メンション',
      type_url: 'URL',
      type_email: 'メールアドレス',
      type_phone: '電話番号',
      backToPreview: '← プレビューに戻る',
      runExtract: '抽出を実行',
      extractResult: '抽出結果',
      csvDownload: 'CSVダウンロード',
      fileSelected: '選択済み: ',
      errNoFile: 'ファイルを選択してください。',
      errFileParse: 'ファイルの読み込みに失敗しました。',
      errNoText: 'テキストを入力してください。',
      errParseFail: 'データの解析に失敗しました。',
      previewInfo: '{cols} 列 × {rows} 行',
      previewInfoAutoCol: '{cols} 列 × {rows} 行（列名は自動生成）',
      previewLimit: '※ プレビューは先頭100行のみ表示',
      colSample: '「{col}」のサンプル値:',
      colOptionSample: '{col}  （例: {samples}）',
      autoColName: '列',
      stats: '{rows} 行から {count} 件の{type}を抽出',
      resultLimit: '※ 表示は先頭500行のみ。全データはCSVダウンロードで取得できます。',
      downloadFileName: '抽出結果.csv'
    },
    en: {
      title: 'Text Entity Extraction Tool',
      subtitle: 'Extract hashtags, mentions, URLs, emails, and phone numbers from table data using regex',
      step1: 'Data Input',
      step2: 'Preview',
      step3: 'Extract & Results',
      dataInput: 'Data Input',
      hasHeader: 'Treat the first row as column headers',
      fileUpload: 'File Upload',
      textPaste: 'Paste Text',
      dropZone: 'Drag & drop a CSV file here<br>or click to select',
      textPlaceholder: 'Paste CSV/TSV data here\n\nExample:\nid,text\n1,Hello #greeting @user1\n2,See https://example.com for details',
      loadBtn: 'Load & Preview →',
      dataPreview: 'Data Preview',
      backToInput: '← Back to Input',
      goToExtract: 'Extract Settings →',
      extractSettings: 'Extract Settings',
      targetCol: 'Target column:',
      extractType: 'Extract type:',
      type_hashtag: 'Hashtag',
      type_mention: 'Mention',
      type_url: 'URL',
      type_email: 'Email',
      type_phone: 'Phone Number',
      backToPreview: '← Back to Preview',
      runExtract: 'Run Extraction',
      extractResult: 'Extraction Results',
      csvDownload: 'Download CSV',
      fileSelected: 'Selected: ',
      errNoFile: 'Please select a file.',
      errFileParse: 'Failed to read the file.',
      errNoText: 'Please enter text.',
      errParseFail: 'Failed to parse data.',
      previewInfo: '{cols} columns × {rows} rows',
      previewInfoAutoCol: '{cols} columns × {rows} rows (auto-generated column names)',
      previewLimit: '* Preview shows only the first 100 rows',
      colSample: 'Sample values for "{col}":',
      colOptionSample: '{col}  (e.g. {samples})',
      autoColName: 'Col',
      stats: 'Extracted {count} {type}(s) from {rows} row(s)',
      resultLimit: '* Showing first 500 rows only. Download CSV for full data.',
      downloadFileName: 'extraction_result.csv'
    }
  };

  let lang = (navigator.language || navigator.userLanguage || 'ja').startsWith('ja') ? 'ja' : 'en';

  function t(key) { return i18n[lang][key] || i18n['ja'][key] || key; }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.getAttribute('data-i18n-html') === 'true') {
        el.innerHTML = t(key);
      } else {
        el.textContent = t(key);
      }
    });
    textInput.placeholder = t('textPlaceholder');
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    if (parsedData) {
      updateColSelect();
      updateColSamplePreview();
    }
  }

  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      applyI18n();
    });
  });

  // ===== State =====
  let parsedData = null;
  let resultData = null;
  let currentStep = 0;

  // ===== Elements =====
  const stepTabs = document.querySelectorAll('.step-tab');
  const stepPanels = document.querySelectorAll('.step-panel');
  const inputTabs = document.querySelectorAll('.input-tab');
  const hasHeaderCheckbox = document.getElementById('hasHeader');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileNameEl = document.getElementById('fileName');
  const textInput = document.getElementById('textInput');
  const loadBtn = document.getElementById('loadBtn');
  const loadMsg = document.getElementById('loadMsg');
  const previewInfo = document.getElementById('previewInfo');
  const previewTableWrap = document.getElementById('previewTableWrap');
  const colSelect = document.getElementById('colSelect');
  const extractBtn = document.getElementById('extractBtn');
  const resultCard = document.getElementById('resultCard');
  const statsEl = document.getElementById('stats');
  const downloadBtn = document.getElementById('downloadBtn');
  const resultTableWrap = document.getElementById('resultTableWrap');

  // ===== Step navigation =====
  function goToStep(step) {
    currentStep = step;
    stepPanels.forEach((p, i) => p.classList.toggle('active', i === step));
    stepTabs.forEach((t, i) => {
      t.classList.remove('active', 'done');
      if (i === step) t.classList.add('active');
      else if (i < step) t.classList.add('done');
    });
  }

  stepTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const step = parseInt(tab.dataset.step);
      if (tab.classList.contains('done')) goToStep(step);
    });
  });

  // ===== Input tab switching =====
  inputTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      inputTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.input-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('input-tab-' + tab.dataset.inputTab).classList.add('active');
    });
  });

  // ===== Drag & Drop =====
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      showFileName(e.dataTransfer.files[0].name);
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) showFileName(fileInput.files[0].name);
  });

  function showFileName(name) {
    fileNameEl.textContent = t('fileSelected') + name;
    fileNameEl.classList.remove('hidden');
  }

  function showMsg(el, text, type) {
    el.className = 'msg msg-' + type;
    el.textContent = text;
    el.classList.remove('hidden');
  }

  // ===== Load data =====
  loadBtn.addEventListener('click', () => {
    loadMsg.classList.add('hidden');
    const activeTab = document.querySelector('.input-tab.active').dataset.inputTab;
    const useHeader = hasHeaderCheckbox.checked;

    if (activeTab === 'file') {
      if (!fileInput.files.length) {
        showMsg(loadMsg, t('errNoFile'), 'error');
        return;
      }
      Papa.parse(fileInput.files[0], {
        header: useHeader,
        skipEmptyLines: true,
        complete: (results) => handleParsed(results, useHeader),
        error: () => showMsg(loadMsg, t('errFileParse'), 'error')
      });
    } else {
      const text = textInput.value.trim();
      if (!text) {
        showMsg(loadMsg, t('errNoText'), 'error');
        return;
      }
      const results = Papa.parse(text, { header: useHeader, skipEmptyLines: true });
      handleParsed(results, useHeader);
    }
  });

  function handleParsed(results, useHeader) {
    let headers, rows;

    if (useHeader) {
      headers = results.meta.fields;
      if (!headers || headers.length === 0) {
        showMsg(loadMsg, t('errParseFail'), 'error');
        return;
      }
      rows = results.data.map(row => headers.map(h => row[h] != null ? String(row[h]) : ''));
    } else {
      rows = results.data;
      if (!rows || rows.length === 0) {
        showMsg(loadMsg, t('errParseFail'), 'error');
        return;
      }
      const colCount = Math.max(...rows.map(r => r.length));
      headers = Array.from({ length: colCount }, (_, i) => t('autoColName') + (i + 1));
      rows = rows.map(r => {
        const padded = r.map(v => v != null ? String(v) : '');
        while (padded.length < colCount) padded.push('');
        return padded;
      });
    }

    parsedData = { headers, rows, useHeader };

    const tpl = useHeader ? t('previewInfo') : t('previewInfoAutoCol');
    previewInfo.textContent = tpl.replace('{cols}', headers.length).replace('{rows}', rows.length);
    renderTable(previewTableWrap, headers, rows.slice(0, 100), false);
    if (rows.length > 100) {
      previewTableWrap.insertAdjacentHTML('beforeend',
        '<p style="color:#7f8c8d; margin-top:8px; font-size:0.85rem;">' + t('previewLimit') + '</p>');
    }

    updateColSelect();
    updateColSamplePreview();

    resultCard.classList.add('hidden');
    goToStep(1);
  }

  function updateColSelect() {
    colSelect.innerHTML = '';
    parsedData.headers.forEach((h, i) => {
      const samples = parsedData.rows.slice(0, 3).map(r => r[i]).filter(v => v).join(', ');
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = samples
        ? t('colOptionSample').replace('{col}', h).replace('{samples}', truncate(samples, 40))
        : h;
      colSelect.appendChild(opt);
    });
  }

  // ===== Column sample preview =====
  const colSamplePreview = document.getElementById('colSamplePreview');
  colSelect.addEventListener('change', updateColSamplePreview);

  function updateColSamplePreview() {
    if (!parsedData) return;
    const idx = parseInt(colSelect.value);
    const header = parsedData.headers[idx];
    const samples = parsedData.rows.slice(0, 5).map(r => r[idx]).filter(v => v);
    if (samples.length === 0) {
      colSamplePreview.classList.add('hidden');
      return;
    }
    colSamplePreview.innerHTML =
      '<div class="col-sample-label">' + escapeHtml(t('colSample').replace('{col}', header)) + '</div>' +
      '<div class="col-sample-values">' +
      samples.map(s => '<span>' + escapeHtml(truncate(s, 80)) + '</span>').join('') +
      '</div>';
    colSamplePreview.classList.remove('hidden');
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  // ===== Navigation buttons =====
  document.getElementById('backToInputBtn').addEventListener('click', () => goToStep(0));
  document.getElementById('goToExtractBtn').addEventListener('click', () => goToStep(2));
  document.getElementById('backToPreviewBtn').addEventListener('click', () => goToStep(1));

  // ===== Regex patterns =====
  const patterns = {
    hashtag: /[#＃]([\w\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FE\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]+)/g,
    mention: /[@＠]([\w]+)/g,
    url: /https?:\/\/[^\s<>"'{}|\\^`\[\]）】」』、。,]+/g,
    email: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
    phone: /(?:0\d{1,4}[-ー]?\d{1,4}[-ー]?\d{2,5}|0\d{9,10}|(?:\+81|＋81)[-ー]?\d{1,4}[-ー]?\d{1,4}[-ー]?\d{2,5})/g
  };

  function getTypeLabel(type) {
    return t('type_' + type);
  }

  // ===== Extract =====
  extractBtn.addEventListener('click', () => {
    if (!parsedData) return;

    const colIdx = parseInt(colSelect.value);
    const extractType = document.querySelector('input[name="extractType"]:checked').value;
    const regex = patterns[extractType];
    const label = getTypeLabel(extractType);

    const newColName = label;
    const resultHeaders = [...parsedData.headers, newColName];
    let matchCount = 0;
    let rowsWithMatch = 0;

    const resultRows = parsedData.rows.map(row => {
      const cellText = row[colIdx] || '';
      const matches = [];
      regex.lastIndex = 0;
      let m;
      while ((m = regex.exec(cellText)) !== null) {
        matches.push(m[0]);
      }
      if (matches.length > 0) {
        matchCount += matches.length;
        rowsWithMatch++;
      }
      return [...row, matches.join(', ')];
    });

    resultData = { headers: resultHeaders, rows: resultRows };
    statsEl.textContent = t('stats')
      .replace('{rows}', rowsWithMatch)
      .replace('{count}', matchCount)
      .replace('{type}', label);

    renderTable(resultTableWrap, resultHeaders, resultRows.slice(0, 500), true);
    if (resultRows.length > 500) {
      resultTableWrap.insertAdjacentHTML('beforeend',
        '<p style="color:#7f8c8d; margin-top:8px; font-size:0.85rem;">' + t('resultLimit') + '</p>');
    }
    resultCard.classList.remove('hidden');
  });

  // ===== Render table =====
  function renderTable(container, headers, rows, highlightLast) {
    let html = '<table><thead><tr>';
    headers.forEach((h, i) => {
      const cls = (highlightLast && i === headers.length - 1) ? ' class="extracted-col"' : '';
      html += '<th' + cls + '>' + escapeHtml(h) + '</th>';
    });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
      html += '<tr>';
      headers.forEach((_, i) => {
        const val = i < row.length ? row[i] : '';
        const cls = (highlightLast && i === row.length - 1) ? ' class="extracted-col"' : '';
        html += '<td' + cls + '>' + escapeHtml(val) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ===== CSV Download =====
  downloadBtn.addEventListener('click', () => {
    if (!resultData) return;
    const csvContent = Papa.unparse({
      fields: resultData.headers,
      data: resultData.rows
    });
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('downloadFileName');
    a.click();
    URL.revokeObjectURL(url);
  });

  // ===== Init =====
  applyI18n();
})();
