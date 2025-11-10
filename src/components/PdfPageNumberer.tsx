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
}

function PdfPageNumberer() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'footer',
    alignment: 'center',
    includeTotalPages: true,
    startPage: 1,
    fontSize: 12,
  });
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('');
    } else {
      setStatus('PDFファイルを選択してください');
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
      const totalPages = pages.length;

      // 各ページにページ番号を追加
      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        const pageNumber = i + options.startPage;
        const text = options.includeTotalPages ? `${pageNumber} / ${totalPages}` : `${pageNumber}`;

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
        <input
          id="pdf-file"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={processing}
        />
        {file && <p style={{ marginTop: '0.5em' }}>選択: {file.name}</p>}
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
        <div className="checkbox-group">
          <input
            id="include-total"
            type="checkbox"
            checked={options.includeTotalPages}
            onChange={(e) => handleOptionChange('includeTotalPages', e.target.checked)}
            disabled={processing}
          />
          <label htmlFor="include-total">総ページ数を含める (例: 1 / 10)</label>
        </div>
      </div>

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
