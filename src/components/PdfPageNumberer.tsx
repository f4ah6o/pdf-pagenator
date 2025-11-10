import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { type ChangeEvent, useState } from 'react';

type Position = 'header' | 'footer';
type Alignment = 'left' | 'center' | 'right';

interface PageNumberOptions {
  position: Position;
  alignment: Alignment;
  includeTotalPages: boolean;
  startPage: number;
  fontSize: number;
  skipCoverPages: boolean;
  coverPagesToSkip: number;
  includeCoverInTotal: boolean;
}

function PdfPageNumberer() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'footer',
    alignment: 'center',
    includeTotalPages: true,
    startPage: 1,
    fontSize: 12,
    skipCoverPages: false,
    coverPagesToSkip: 1,
    includeCoverInTotal: true,
  });
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('');
    } else {
      setStatus('PDFファイルを選択してください');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setStatus('');
    } else {
      setStatus('PDFファイルをドロップしてください');
    }
  };

  const handleOptionChange = (
    key: keyof PageNumberOptions,
    value: Position | Alignment | boolean | number
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const addPageNumbers = async () => {
    if (!file) {
      setStatus('ファイルを選択してください');
      return;
    }

    setProcessing(true);
    setStatus('処理中...');

    try {
      // PDFファイルを読み込み
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // フォントを埋め込み
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const totalPagesInDoc = pages.length;

      // 総ページ数の計算
      const displayTotalPages =
        options.skipCoverPages && !options.includeCoverInTotal
          ? totalPagesInDoc - options.coverPagesToSkip
          : totalPagesInDoc;

      // 各ページにページ番号を追加
      for (let i = 0; i < totalPagesInDoc; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // 表紙スキップ機能が有効で、スキップ範囲内の場合はページ番号を描画しない
        if (options.skipCoverPages && i < options.coverPagesToSkip) {
          continue;
        }

        // ページ番号の計算（スキップしたページ分を調整）
        const pageNumber = options.skipCoverPages
          ? i - options.coverPagesToSkip + options.startPage
          : i + options.startPage;

        const text = options.includeTotalPages
          ? `${pageNumber} / ${displayTotalPages}`
          : `${pageNumber}`;

        const textWidth = font.widthOfTextAtSize(text, options.fontSize);

        // X座標を決定（左・中央・右）
        let x: number;
        switch (options.alignment) {
          case 'left':
            x = 50;
            break;
          case 'right':
            x = width - textWidth - 50;
            break;
          default:
            x = (width - textWidth) / 2;
            break;
        }

        // Y座標を決定（ヘッダー・フッター）
        const y = options.position === 'header' ? height - 30 : 30;

        // ページ番号を描画
        page.drawText(text, {
          x,
          y,
          size: options.fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // PDFを保存
      const pdfBytes = await pdfDoc.save();

      // ダウンロード
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `numbered_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      setStatus('完了しました！ダウンロードが開始されます。');
    } catch (error) {
      console.error('Error processing PDF:', error);
      setStatus(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="form-group">
        <label htmlFor="pdf-file">PDFファイルを選択</label>
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="pdf-file"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={processing}
            style={{ display: 'none' }}
          />
          <label htmlFor="pdf-file" className="dropzone-label">
            {file ? (
              <span>選択: {file.name}</span>
            ) : (
              <span>
                クリックしてファイルを選択
                <br />
                または
                <br />
                ここにファイルをドロップ
              </span>
            )}
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="position">位置</label>
        <select
          id="position"
          value={options.position}
          onChange={(e) => handleOptionChange('position', e.target.value as Position)}
          disabled={processing}
        >
          <option value="header">ヘッダー</option>
          <option value="footer">フッター</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="alignment">寄せ</label>
        <select
          id="alignment"
          value={options.alignment}
          onChange={(e) => handleOptionChange('alignment', e.target.value as Alignment)}
          disabled={processing}
        >
          <option value="left">左</option>
          <option value="center">中央</option>
          <option value="right">右</option>
        </select>
      </div>

      <div className="form-group">
        <div className="toggle-group">
          <label htmlFor="include-total">総ページ数を含める (例: 1 / 10)</label>
          <label className="toggle-switch">
            <input
              id="include-total"
              type="checkbox"
              checked={options.includeTotalPages}
              onChange={(e) => handleOptionChange('includeTotalPages', e.target.checked)}
              disabled={processing}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="form-group">
        <div className="toggle-group">
          <label htmlFor="skip-cover">表紙の番号記載をスキップ</label>
          <label className="toggle-switch">
            <input
              id="skip-cover"
              type="checkbox"
              checked={options.skipCoverPages}
              onChange={(e) => handleOptionChange('skipCoverPages', e.target.checked)}
              disabled={processing}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {options.skipCoverPages && (
        <>
          <div className="form-group">
            <label htmlFor="cover-pages">スキップするページ数</label>
            <input
              id="cover-pages"
              type="number"
              min="1"
              value={options.coverPagesToSkip}
              onChange={(e) => handleOptionChange('coverPagesToSkip', Number(e.target.value))}
              disabled={processing}
            />
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <label htmlFor="include-cover-in-total">スキップしたページを総ページ数に含める</label>
              <label className="toggle-switch">
                <input
                  id="include-cover-in-total"
                  type="checkbox"
                  checked={options.includeCoverInTotal}
                  onChange={(e) => handleOptionChange('includeCoverInTotal', e.target.checked)}
                  disabled={processing}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="font-size">フォントサイズ</label>
        <select
          id="font-size"
          value={options.fontSize}
          onChange={(e) => handleOptionChange('fontSize', Number(e.target.value))}
          disabled={processing}
        >
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
        </select>
      </div>

      <div className="button-group">
        <button type="button" onClick={addPageNumbers} disabled={!file || processing}>
          {processing ? '処理中...' : 'ページ番号を追加'}
        </button>
      </div>

      {status && (
        <div className="preview-area">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}

export default PdfPageNumberer;
