import './App.css';
import PdfPageNumberer from './components/PdfPageNumberer';

function App() {
  return (
    <div className="container">
      <h1>PDF ページ番号付与</h1>
      <p>PDFファイルにページ番号を追加します（完全ブラウザ内処理）</p>
      <PdfPageNumberer />
    </div>
  );
}

export default App;
