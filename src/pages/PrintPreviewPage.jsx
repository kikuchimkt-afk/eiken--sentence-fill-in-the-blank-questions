import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import data from '../data.json';
import './PrintPreviewPage.css';

// Helper to format text with bold placeholders
const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const parts = line.split(/(\(\s*\d+\s*\))/g);
        return (
            <p key={i} className="passage-paragraph">
                {parts.map((part, j) => {
                    if (/^\(\s*\d+\s*\)$/.test(part)) {
                        return <span key={j} className="bold-placeholder">{part}</span>;
                    }
                    return part;
                })}
            </p>
        );
    });
};

export function PrintPreviewPage() {
    const { index } = useParams();
    const [examData, setExamData] = useState(null);

    useEffect(() => {
        if (index !== undefined && data[index]) {
            setExamData(data[index]);
            document.title = `${data[index].title} - Print Preview`;
        }
    }, [index]);

    const handlePrint = () => {
        window.print();
    };

    if (!examData) {
        return <div className="print-loading">Loading exam data...</div>;
    }

    // Check if it is Pre-Grade 2 Dialog (Force Page Break)
    const isPre2 = examData.title.includes('準2級') &&
        !examData.title.includes('プラス') &&
        (examData.title.includes('大問2') || examData.title.includes('大問２'));

    const getAnswerString = () => {
        if (!examData || !examData.questions) return '';
        return examData.questions.map(q => `(${q.number}) ${q.correctAnswer}`).join('  ');
    };

    return (
        <div className="print-page-container">
            <div className="print-controls no-print">
                <button onClick={handlePrint} className="print-button">
                    🖨️ 印刷する (Print)
                </button>
                <div className="print-instructions">
                    ※ A4用紙・縦向きで印刷してください。<br />
                    ※ ブラウザの印刷設定で「背景のグラフィック」を有効にするとより綺麗です。
                </div>
            </div>

            <div className="print-content a4-page flex-page">
                <header className="exam-header">
                    <h1 className="exam-title">{examData.title}</h1>
                    {examData.englishTitle && (
                        <h2 className="exam-subtitle">{examData.englishTitle}</h2>
                    )}
                </header>

                <div className="exam-content-flex">
                    <section className="passage-section">
                        {formatText(examData.passage)}
                    </section>

                    <div className={`questions-footer-wrapper ${isPre2 ? 'page-break-before force-height' : ''}`}>
                        <section className="questions-section">
                            {examData.questions.map((q, qIdx) => (
                                <div key={qIdx} className="question-block avoid-break">
                                    <div className="question-number">({q.number})</div>
                                    <div className="choices-grid">
                                        {q.choices.map((c) => (
                                            <div key={c.index} className="choice-item">
                                                <span className="choice-index">{c.index}</span>
                                                <span className="choice-text">{c.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </section>

                        <footer className="exam-footer">
                            <div className="answers-row">
                                <span className="answers-label">【正解】</span>
                                <span className="answers-content">{getAnswerString()}</span>
                            </div>
                            <div className="copyright-row">
                                © ECCベストワン藍住・北島中央
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}
