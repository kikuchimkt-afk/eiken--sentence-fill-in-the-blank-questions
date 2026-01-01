/* QuizPage.jsx - Enhanced Verb Highlight and Notes Display */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Home, EyeOff, ClipboardList } from 'lucide-react';
import data from '../data.json';
import './QuizPage.css';

export function QuizPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Student mode: hide home button when accessed via QR code
    const isStudentMode = searchParams.get('student') === 'true';

    const quizIndex = id ? parseInt(id, 10) : 0;
    const currentItem = data[quizIndex] || data[0];

    const [sentences, setSentences] = useState([]);
    const [activeSentenceId, setActiveSentenceId] = useState(null);
    const [showNotes, setShowNotes] = useState(false);
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const aidPanelRef = useRef(null);

    const groupedSentences = useMemo(() => {
        if (!sentences.length) return {};
        const groups = {};
        sentences.forEach(sent => {
            const key = sent.relatedQ || 'Other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(sent);
        });
        return groups;
    }, [sentences]);

    const questionNumbers = useMemo(() =>
        Object.keys(groupedSentences).sort((a, b) => parseInt(a) - parseInt(b)),
        [groupedSentences]
    );

    useEffect(() => {
        if (currentItem && currentItem.sentences) {
            const distinctPassage = currentItem.passage.replace(/\\n/g, '\n');
            const rawParagraphs = distinctPassage
                .split(/(?:\r?\n\s*\r?\n)|(?:\r?\n(?=[\u0020\u3000\t]))/)
                .filter(p => p.trim());

            const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

            const sentencesWithParagraphInfo = currentItem.sentences.map((sent, idx) => {
                let isParagraphEnd = sent.isParagraphEnd;
                if (isParagraphEnd === undefined) {
                    isParagraphEnd = rawParagraphs.some(para => {
                        const paraNorm = normalize(para);
                        const sentNorm = normalize(sent.english);
                        return paraNorm.endsWith(sentNorm) && sentNorm.length > 5;
                    });
                }

                let displayText = sent.english;
                // Question Placeholder Replacement Logic
                if (sent.relatedQuestions && sent.relatedQuestions.length > 0) {
                    sent.relatedQuestions.forEach(qNum => {
                        const qData = currentItem.questions.find(q => q.number === qNum);
                        if (qData) {
                            const correctChoice = qData.choices.find(c => c.index === qData.correctAnswer);
                            if (correctChoice) {
                                const escapedChoice = correctChoice.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(`\\(\\s*${qNum}\\s*\\)`, 'i'); // Match ( 19 ) etc.
                                // Don't replace full text yet, just keep the placeholder logic consistent
                            }
                        }
                    });
                }

                return {
                    ...sent,
                    displayEnglish: displayText,
                    isParagraphEnd,
                    relatedQ: sent.relatedQuestions && sent.relatedQuestions.length > 0
                        ? sent.relatedQuestions[0]
                        : (sent.relatedQ || 'Other')
                };
            });

            setSentences(sentencesWithParagraphInfo);
            if (sentencesWithParagraphInfo.length > 0) {
                setActiveSentenceId(sentencesWithParagraphInfo[0].id);
            }
        }
        window.scrollTo(0, 0);
    }, [currentItem]);

    const activeSentence = useMemo(() =>
        sentences.find(s => s.id === activeSentenceId),
        [sentences, activeSentenceId]
    );

    useEffect(() => {
        if (aidPanelRef.current) {
            aidPanelRef.current.scrollTop = 0;
        }
    }, [activeSentenceId, showNotes]);

    const scrollToQuestion = (qNum) => {
        const element = document.getElementById(`question-group-${qNum}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const highlightMainVerb = (text, mainVerb, isActive) => {
        if (!mainVerb || !isActive) return text;

        const verbs = mainVerb.split(',').map(v => v.trim()).filter(v => v);
        if (verbs.length === 0) return text;

        // Create regex for whole word match, case insensitive
        const pattern = `(${verbs.map(v => `\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).join('|')})`;
        const regex = new RegExp(pattern, 'i');

        const parts = text.split(regex);
        if (parts.length === 1) return text;

        return parts.map((part, i) => {
            const isMatch = verbs.some(v => v.toLowerCase() === part.toLowerCase());
            if (isMatch) {
                // Inline style for absolute certainty
                return <span key={i} className="main-verb-highlight" style={{ color: '#ef4444', fontWeight: 'bold' }}>{part}</span>;
            }
            return part;
        });
    };

    if (!currentItem) {
        return <div className="loading">Loading data...</div>;
    }

    return (
        <div className="quiz-page eiken-paper-mode">
            <header className="quiz-header">
                <div className="header-title">
                    <h1 className="main-title">{currentItem.englishTitle || currentItem.title}</h1>
                    {currentItem.englishTitle && currentItem.title && (
                        <div className="sub-title">{currentItem.title}</div>
                    )}

                    <div className="question-nav">
                        {questionNumbers.filter(qNum => qNum !== 'Other').map(qNum => (
                            <button key={qNum} onClick={() => scrollToQuestion(qNum)} className="nav-pill">
                                ({qNum})
                            </button>
                        ))}
                    </div>
                </div>
                <div className="header-actions">
                    {!isStudentMode && (
                        <button onClick={() => setShowHomeworkModal(true)} className="homework-btn-top" title="宿題プリント作成">
                            <ClipboardList size={18} />
                            <span>📝 宿題</span>
                        </button>
                    )}
                    {!isStudentMode && (
                        <button onClick={() => navigate('/')} className="home-btn-top" title="トップへ戻る">
                            <Home size={20} />
                            <span>🏠 ホーム</span>
                        </button>
                    )}
                </div>
            </header >

            <div className="split-view">
                <div className="text-panel">
                    <div className="panel-content paper-layout">
                        {sentences.length > 0 ? (
                            <div className="questions-container">
                                {(() => {
                                    const isConversationMode = sentences.some(s => /^[AB]:/.test(s.english.replace(/^[-・●\s\u3000]+/, '').trim()));

                                    // ... Conversation Mode Logic (Skipped for brevity, identical to previous mostly) ...
                                    if (isConversationMode) {
                                        // Conversation Mode - Group by paragraph breaks
                                        const paragraphs = [];
                                        let currentP = [];
                                        sentences.forEach(s => {
                                            currentP.push(s);
                                            if (s.isParagraphEnd) {
                                                paragraphs.push(currentP);
                                                currentP = [];
                                            }
                                        });
                                        if (currentP.length > 0) paragraphs.push(currentP);

                                        return (
                                            <div className="conversation-mode-container" style={{ paddingRight: '10px' }}>
                                                <div className="panel-title" style={{
                                                    background: 'white',
                                                    borderRadius: '8px',
                                                    border: '2px solid #94a3b8',
                                                    padding: '16px',
                                                    marginBottom: '20px',
                                                    textAlign: 'center',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                }}>
                                                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#334155', fontFamily: '"Times New Roman", Times, serif' }}>
                                                        {currentItem.englishTitle || currentItem.title}
                                                    </h2>
                                                </div>

                                                {paragraphs.map((paragraph, pIndex) => (
                                                    <div key={pIndex} className="paragraph-panel" style={{
                                                        background: 'white',
                                                        borderRadius: '12px',
                                                        border: '2px solid #94a3b8',
                                                        padding: '24px',
                                                        marginBottom: '16px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <div style={{ fontSize: '1.05rem', lineHeight: '1.9', color: '#1e293b' }}>
                                                            {paragraph.map((sent) => {
                                                                const cleanText = (sent.displayEnglish || sent.english).replace(/^[-・●\s\u3000]+/, '').trim();
                                                                const isActive = activeSentenceId === sent.id;
                                                                return (
                                                                    <div
                                                                        key={sent.id}
                                                                        className={`line-item ${isActive ? 'active' : ''}`}
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            padding: '6px 8px',
                                                                            marginBottom: '4px',
                                                                            borderRadius: '6px',
                                                                            background: isActive ? '#fef3c7' : 'transparent',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onClick={() => setActiveSentenceId(sent.id)}
                                                                    >
                                                                        {cleanText.split(/(\(\s*\d+\s*\))/).map((part, i) => {
                                                                            const match = part.match(/\(\s*(\d+)\s*\)/);
                                                                            if (match) {
                                                                                const qNum = parseInt(match[1]);
                                                                                const qData = currentItem.questions?.find(q => q.number === qNum);
                                                                                const correctChoice = qData?.choices?.find(c => c.index === qData.correctAnswer);
                                                                                const isAnswered = showNotes && correctChoice;

                                                                                return (
                                                                                    <span
                                                                                        key={i}
                                                                                        className={`blank-slot ${isAnswered ? 'filled-answer' : 'emphasized'}`}
                                                                                        style={{
                                                                                            fontWeight: 'bold',
                                                                                            fontStyle: 'normal',
                                                                                            fontSize: 'inherit',
                                                                                            fontFamily: 'inherit',
                                                                                            letterSpacing: 'inherit',
                                                                                            color: isAnswered ? '#16a34a' : '#1d4ed8',
                                                                                            background: isAnswered ? 'transparent' : '#fef08a',
                                                                                            padding: isAnswered ? '0' : '2px 6px',
                                                                                            borderRadius: '4px',
                                                                                            margin: isAnswered ? '0' : '0 4px',
                                                                                            borderBottom: isAnswered ? 'none' : 'none'
                                                                                        }}
                                                                                    >
                                                                                        {isAnswered ? correctChoice.text : part}
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return <React.Fragment key={i}>{highlightMainVerb(part, sent.mainVerb, isActive)}</React.Fragment>;
                                                                        })}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="passage-actions" style={{ marginTop: '30px', textAlign: 'center' }}>
                                                    <button
                                                        className={`explain-btn ${showNotes ? 'hide-mode' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!showNotes && !activeSentenceId && sentences.length > 0) {
                                                                setActiveSentenceId(sentences[0].id);
                                                            }
                                                            setShowNotes(!showNotes);
                                                        }}
                                                    >
                                                        {showNotes ? (
                                                            <><EyeOff size={20} style={{ marginRight: 8 }} /> 解説を隠す</>
                                                        ) : (
                                                            <><BookOpen size={20} style={{ marginRight: 8 }} /> 全体の解説・解答を表示</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Passage Mode
                                        const paragraphs = [];
                                        let currentP = [];
                                        sentences.forEach(s => {
                                            currentP.push(s);
                                            if (s.isParagraphEnd) {
                                                paragraphs.push(currentP);
                                                currentP = [];
                                            }
                                        });
                                        if (currentP.length > 0) paragraphs.push(currentP);

                                        return (
                                            <div className="passage-mode-container" style={{ paddingRight: '10px' }}>
                                                <div className="panel-title" style={{
                                                    background: 'white',
                                                    borderRadius: '8px',
                                                    border: '2px solid #94a3b8',
                                                    padding: '16px',
                                                    marginBottom: '20px',
                                                    textAlign: 'center',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                }}>
                                                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#334155', fontFamily: '"Times New Roman", Times, serif' }}>
                                                        {currentItem.englishTitle || currentItem.title}
                                                    </h2>
                                                </div>

                                                {paragraphs.map((paragraph, pIndex) => (
                                                    <div key={pIndex} className="paragraph-panel" style={{
                                                        background: 'white',
                                                        borderRadius: '12px',
                                                        border: '2px solid #94a3b8',
                                                        padding: '24px',
                                                        marginBottom: '16px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <div style={{ fontSize: '1.1rem', lineHeight: '1.9', textAlign: 'justify', color: '#1e293b' }}>
                                                            {paragraph.map((sent) => {
                                                                const cleanText = (sent.displayEnglish || sent.english).replace(/^[-・●\s\u3000]+/, '').trim();
                                                                return (
                                                                    <span
                                                                        key={sent.id}
                                                                        className={`line-item ${activeSentenceId === sent.id ? 'active' : ''} passage-line`}
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            transition: 'background-color 0.2s',
                                                                            marginRight: '0.25em',
                                                                            borderRadius: '4px',
                                                                            padding: '2px 0'
                                                                        }}
                                                                        onClick={() => {
                                                                            setActiveSentenceId(sent.id);
                                                                        }}
                                                                    >
                                                                        {cleanText.split(/(\(\s*\d+\s*\))/).map((part, i) => {
                                                                            const match = part.match(/\(\s*(\d+)\s*\)/);
                                                                            if (match) {
                                                                                const qNum = parseInt(match[1]);
                                                                                const qData = currentItem.questions?.find(q => q.number === qNum);
                                                                                const correctChoice = qData?.choices?.find(c => c.index === qData.correctAnswer);
                                                                                const isAnswered = showNotes && correctChoice;

                                                                                return (
                                                                                    <span
                                                                                        key={i}
                                                                                        className={`blank-slot ${isAnswered ? 'filled-answer' : 'emphasized'}`}
                                                                                        style={{
                                                                                            fontWeight: 'bold',
                                                                                            fontStyle: 'normal',
                                                                                            fontSize: 'inherit',
                                                                                            fontFamily: 'inherit',
                                                                                            letterSpacing: 'inherit',
                                                                                            color: isAnswered ? '#16a34a' : '#1d4ed8', // 統一のため青色コードもConversation modeと合わせる
                                                                                            background: isAnswered ? 'transparent' : '#fef08a',
                                                                                            padding: isAnswered ? '0' : '2px 6px',
                                                                                            borderRadius: '4px',
                                                                                            margin: isAnswered ? '0' : '0 4px',
                                                                                            borderBottom: isAnswered ? 'none' : 'none'
                                                                                        }}
                                                                                    >
                                                                                        {isAnswered ? correctChoice.text : part}
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            // Highlight Verb here
                                                                            const isActive = activeSentenceId === sent.id;
                                                                            return <React.Fragment key={i}>{highlightMainVerb(part, sent.mainVerb, isActive)}</React.Fragment>;
                                                                        })}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="passage-actions" style={{ marginTop: '30px', textAlign: 'center' }}>
                                                    <button
                                                        className={`explain-btn ${showNotes ? 'hide-mode' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!showNotes && !activeSentenceId && sentences.length > 0) {
                                                                setActiveSentenceId(sentences[0].id);
                                                            }
                                                            setShowNotes(!showNotes);
                                                        }}
                                                    >
                                                        {showNotes ? (
                                                            <><EyeOff size={16} style={{ marginRight: '6px' }} /> 解説を隠す</>
                                                        ) : (
                                                            <><BookOpen size={16} style={{ marginRight: '6px' }} /> 全体の解説・解答を表示</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        ) : (
                            <div className="raw-text">{currentItem.passage || "No content."}</div>
                        )}
                    </div>
                </div>

                <div className="aid-panel" ref={aidPanelRef}>
                    {activeSentence ? (
                        <div className="aid-content fade-in">
                            <div className="aid-section translation-section">
                                <div className="section-label highlight">
                                    <span className="icon">🇯🇵</span> 日本語訳
                                </div>
                                <div className="japanese-text-container">
                                    {activeSentence.japanese ? (
                                        <div style={{
                                            background: '#fef3c7',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            marginBottom: '16px',
                                            borderLeft: '4px solid #f59e0b'
                                        }}>
                                            <div className="translation-line">{activeSentence.japanese}</div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#9ca3af', fontStyle: 'italic', padding: '10px' }}>日本語訳データなし</div>
                                    )}
                                </div>
                            </div>

                            {!showNotes ? null : (
                                <div className="aid-section notes-section">
                                    <div className="section-label">
                                        <span className="icon">📝</span> 解説・語句
                                    </div>

                                    {/* 1. Sentence Grammar Notes (Always show if available) */}
                                    {activeSentence.notes && (
                                        <div style={{ marginBottom: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>文の構造・語句</div>
                                            <ul className="notes-list no-bullets">
                                                {activeSentence.notes.split('\n').filter(n => n.trim()).map((note, index) => (
                                                    <li key={index} className="note-item" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '0.9rem', color: '#1e3a8a' }}>
                                                        {note}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 2. Question Data (Only show if this sentence has a blank slot) */}
                                    {(() => {
                                        // Check if the sentence contains a blank like ( 18 ), ( 19 ), etc.
                                        const hasBlank = /\(\s*\d+\s*\)/.test(activeSentence.english || activeSentence.displayEnglish || '');
                                        if (!hasBlank) return null;

                                        const qData = currentItem.questions?.find(q => q.number === activeSentence.relatedQ || q.number === parseInt(activeSentence.relatedQ));
                                        if (!qData) return null;
                                        return <ExplanationPanel qData={qData} />;
                                    })()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>左側の文をクリックすると<br />ここに解説が表示されます</p>
                        </div>
                    )}
                </div>
            </div>

            {!isStudentMode && (
                <div className="bottom-home-container">
                    <button onClick={() => navigate('/')} className="home-btn-bottom">
                        <Home size={20} />
                        <span>🏠 ホームに戻る</span>
                    </button>
                </div>
            )}

            {/* Homework Modal */}
            {showHomeworkModal && (
                <HomeworkModal
                    currentItem={currentItem}
                    quizIndex={quizIndex}
                    questionNumbers={questionNumbers}
                    onClose={() => setShowHomeworkModal(false)}
                />
            )}
        </div >
    );
}

// Homework Modal Component
function HomeworkModal({ currentItem, quizIndex, questionNumbers, onClose }) {
    const [teacherName, setTeacherName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [deadline, setDeadline] = useState(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    });
    const [comment, setComment] = useState('頑張ってね！');

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    const getGradeFromTitle = (title) => {
        if (title.includes('準1級')) return '準1級';
        if (title.includes('準2級プラス')) return '準2級プラス';
        if (title.includes('準2級')) return '準2級';
        if (title.includes('2級')) return '2級';
        return '';
    };

    const handlePrint = () => {
        const baseUrl = 'https://eiken-sentence-fill-in-the-blank-qu.vercel.app';
        const quizUrl = `${baseUrl}/quiz/${quizIndex}?student=true`;
        const todayStr = formatDate(new Date().toISOString().split('T')[0]);
        const deadlineStr = deadline ? formatDate(deadline) : '未設定';
        const grade = getGradeFromTitle(currentItem.title);
        const qNums = questionNumbers.filter(q => q !== 'Other');

        // Generate answer rows
        let answerRows = '';
        qNums.forEach(num => {
            answerRows += `<tr><td style="font-weight: bold; padding: 15px;">(${num})</td><td style="padding: 15px;"></td><td style="padding: 15px;"></td></tr>`;
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>解答用紙 - ${currentItem.englishTitle || currentItem.title}</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <style>
                    body { 
                        font-family: 'Yu Gothic', 'Hiragino Sans', sans-serif; 
                        padding: 30px;
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
                    .subtitle { font-size: 1rem; color: #666; }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 20px;
                        padding: 15px;
                        background: #f8fafc;
                        border-radius: 8px;
                    }
                    .info-item { display: flex; gap: 8px; }
                    .info-label { font-weight: 700; color: #555; }
                    .comment-box {
                        background: #fff3cd;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        border-left: 4px solid #ffc107;
                    }
                    .comment-label { font-weight: 700; color: #856404; margin-bottom: 5px; }
                    .answer-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .answer-table th, .answer-table td {
                        border: 2px solid #333;
                        text-align: center;
                    }
                    .answer-table th { background: #e2e8f0; padding: 12px; }
                    .qr-section {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        padding: 15px;
                        background: #f0f9ff;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    .qr-text { font-size: 0.9rem; color: #0369a1; }
                    @media print {
                        .info-grid { background: #f8f8f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .comment-box { background: #fffbe6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .qr-section { background: #f0f9ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">英検${grade} 長文空所補充問題 解答用紙</div>
                    <div class="subtitle">📖 ${currentItem.englishTitle || currentItem.title}</div>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">📅 出題日:</span>
                        <span>${todayStr}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">⏰ 提出期限:</span>
                        <span>${deadlineStr}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">👨‍🏫 担当講師:</span>
                        <span>${teacherName || '未設定'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">📝 生徒名:</span>
                        <span>${studentName || '________________'}</span>
                    </div>
                </div>

                <div class="comment-box">
                    <div class="comment-label">💬 先生からのメッセージ</div>
                    <div>${comment}</div>
                </div>

                <h3 style="margin-bottom: 10px;">📝 解答欄</h3>
                <table class="answer-table">
                    <thead>
                        <tr>
                            <th style="width: 100px;">問題番号</th>
                            <th style="width: 150px;">あなたの解答</th>
                            <th style="width: 100px;">正誤</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${answerRows}
                    </tbody>
                </table>

                <div class="qr-section">
                    <div id="qrcode"></div>
                    <div class="qr-text">
                        <strong>📱 解説を確認</strong><br>
                        このQRコードをスマホでスキャンすると、<br>
                        解説ページを見ることができます。
                    </div>
                </div>

                <script>
                    new QRCode(document.getElementById('qrcode'), {
                        text: '${quizUrl}',
                        width: 100,
                        height: 100,
                        colorDark: "#0369a1",
                        colorLight: "#ffffff",
                    });
                    setTimeout(() => { window.print(); }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="homework-modal-overlay" onClick={onClose}>
            <div className="homework-modal" onClick={e => e.stopPropagation()}>
                <div className="homework-modal-header">
                    <h2>📝 宿題プリント作成</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="homework-modal-body">
                    <div className="form-group">
                        <label>👨‍🏫 担当講師名</label>
                        <input
                            type="text"
                            value={teacherName}
                            onChange={(e) => setTeacherName(e.target.value)}
                            placeholder="例：山田先生"
                        />
                    </div>
                    <div className="form-group">
                        <label>📝 生徒名</label>
                        <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="例：田中太郎（空欄可）"
                        />
                    </div>
                    <div className="form-group">
                        <label>📅 提出期限</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>💬 応援のコメント</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="頑張ってね！"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="homework-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>キャンセル</button>
                    <button className="btn-print" onClick={handlePrint}>🖨️ 印刷する</button>
                </div>
            </div>
        </div>
    );
}

function ExplanationPanel({ qData }) {
    const hasNuance = !!qData.nuanceExplanation;
    // ニュアンス解説がある場合は 'beginner' デフォルト、ない場合は 'academic'
    const [mode, setMode] = useState(hasNuance ? 'beginner' : 'academic');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Choices */}
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>選択肢</div>
                {qData.choices.map((choice) => (
                    <div
                        key={choice.index}
                        style={{
                            padding: '4px 8px',
                            marginBottom: '4px',
                            borderRadius: '4px',
                            background: choice.index === qData.correctAnswer ? '#dcfce7' : 'transparent',
                            fontWeight: choice.index === qData.correctAnswer ? 'bold' : 'normal',
                            color: choice.index === qData.correctAnswer ? '#15803d' : '#374151'
                        }}
                    >
                        {choice.index}. {choice.text}
                        {choice.index === qData.correctAnswer && ' ✓'}
                    </div>
                ))}
            </div>

            {/* Content and Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                    <button
                        onClick={() => setMode('beginner')}
                        disabled={!hasNuance}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: 'none',
                            background: mode === 'beginner' ? '#10b981' : '#f3f4f6',
                            color: mode === 'beginner' ? 'white' : (!hasNuance ? '#d1d5db' : '#4b5563'),
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            cursor: hasNuance ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: hasNuance ? 1 : 0.6
                        }}
                    >
                        🔰 初学者向け
                    </button>
                    <button
                        onClick={() => setMode('academic')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: 'none',
                            background: mode === 'academic' ? '#3b82f6' : '#f3f4f6',
                            color: mode === 'academic' ? 'white' : '#4b5563',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        🎓 アカデミック
                    </button>
                </div>

                {/* Content Body */}
                <div style={{
                    padding: '12px',
                    background: mode === 'beginner' ? '#ecfdf5' : '#fffbeb',
                    borderRadius: '8px',
                    border: `1px solid ${mode === 'beginner' ? '#6ee7b7' : '#fcd34d'}`
                }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: mode === 'beginner' ? '#047857' : '#92400e', marginBottom: '8px' }}>
                        {mode === 'beginner' ? 'ワンポイント解説' : '詳しい解説'}
                    </div>
                    <div style={{ lineHeight: '1.7', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                        {mode === 'beginner' ? (
                            qData.nuanceExplanation
                        ) : (
                            // アカデミック版（ハイライト付き）
                            qData.explanation && qData.explanation.replace(/\\n/g, '\n').split('\n').map((line, idx) => {
                                const isCorrectLine = line.includes('→ 正解') || line.includes('→正解');
                                return (
                                    <div key={idx} style={{
                                        color: isCorrectLine ? '#dc2626' : 'inherit',
                                        fontWeight: isCorrectLine ? 'bold' : 'normal',
                                        backgroundColor: isCorrectLine ? '#fee2e2' : 'transparent',
                                        padding: isCorrectLine ? '4px 6px' : '0',
                                        borderRadius: isCorrectLine ? '4px' : '0',
                                        marginBottom: '2px'
                                    }}>
                                        {line || <br />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
