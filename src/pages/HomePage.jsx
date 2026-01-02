import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import data from '../data.json';
import './HomePage.css';

// 背景画像の数
const TOTAL_BACKGROUNDS = 5;

export function HomePage() {
    // 背景画像のインデックス（1-5）
    const [bgIndex, setBgIndex] = useState(1);

    // 背景画像のローテーション（シャッフルなし、順番に）
    useEffect(() => {
        // localStorageから現在のインデックスを取得
        const storedIndex = localStorage.getItem('bgImageIndex');
        let currentIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
        
        // 次のインデックスに移動（1から5を順番にループ）
        currentIndex = (currentIndex % TOTAL_BACKGROUNDS) + 1;
        
        // 状態を更新
        setBgIndex(currentIndex);
        
        // 次回のためにlocalStorageに保存
        localStorage.setItem('bgImageIndex', currentIndex.toString());
    }, []);

    // Resume scroll position when returning from quiz
    useEffect(() => {
        const savedPosition = sessionStorage.getItem('homeScrollPosition');
        if (savedPosition) {
            // Small timeout ensures layout is stable before scrolling
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedPosition, 10));
            }, 0);
        }
    }, []);

    // Save scroll position before navigating
    const saveScrollPosition = () => {
        sessionStorage.setItem('homeScrollPosition', window.scrollY.toString());
    };

    // データを級別・年度降順にソート
    const categorizeAndSort = () => {
        const grade2 = [];
        const preGrade2Plus = [];  // 準2級プラス
        const preGrade2 = [];
        const preGrade1 = [];

        data.forEach((item, index) => {
            const itemWithIndex = { ...item, originalIndex: index };

            // タイトルまたはfilenameから級を判定
            const title = item.title || item.filename;
            const filename = item.filename || '';
            if (title.includes('準2級プラス') || filename.includes('pre2plus')) {
                preGrade2Plus.push(itemWithIndex);
            } else if (title.includes('2級') && !title.includes('準')) {
                grade2.push(itemWithIndex);
            } else if (title.includes('準1級')) {
                preGrade1.push(itemWithIndex);
            } else {
                preGrade2.push(itemWithIndex);
            }
        });

        // 年度で降順ソート（新しいものが上）
        const sortByYear = (a, b) => {
            const getYear = (item) => {
                const match = (item.title || item.filename).match(/(\d{4})年度/);
                return match ? parseInt(match[1]) : 0;
            };
            const getSession = (item) => {
                const match = (item.title || item.filename).match(/第(\d+)回/);
                return match ? parseInt(match[1]) : 0;
            };
            const getSection = (item) => {
                // For Grade 2: 2A, 2B
                const match1 = (item.title || item.filename).match(/大問2([A-Z])/);
                if (match1) return match1[1];

                // For Pre-Grade 1: 2-1, 2-2
                const match2 = (item.title || item.filename).match(/大問2-(\d+)/);
                if (match2) return match2[1];

                return '';
            };

            // First by year (descending)
            const yearDiff = getYear(b) - getYear(a);
            if (yearDiff !== 0) return yearDiff;

            // Then by session (descending)
            const sessionDiff = getSession(b) - getSession(a);
            if (sessionDiff !== 0) return sessionDiff;

            // Finally by section (ascending: A before B before C)
            const sectionA = getSection(a);
            const sectionB = getSection(b);
            return sectionA.localeCompare(sectionB);
        };

        return {
            grade2: grade2.sort(sortByYear),
            preGrade2Plus: preGrade2Plus.sort(sortByYear),
            preGrade2: preGrade2.sort(sortByYear),
            preGrade1: preGrade1.sort(sortByYear)
        };
    };

    const { grade2, preGrade2Plus, preGrade2, preGrade1 } = categorizeAndSort();

    const handlePrint = (e, item) => {
        e.preventDefault();
        e.stopPropagation();

        const imageUrl = `/images/${item.filename}.png`;
        const printUrl = `/print.html?image=${encodeURIComponent(imageUrl)}`;

        // Open dedicated print page
        window.open(printUrl, '_blank');
    };

    const getYearFromTitle = (title) => {
        const match = title.match(/(\d{4})年度/);
        return match ? match[1] : '';
    };

    const getCompactTitle = (title) => {
        const sessionMatch = title.match(/第(\d+)回/);
        const problemMatch = title.match(/大問(\d+[A-Z]?)/);
        const pre1Match = title.match(/大問2-(\d+)/);

        if (sessionMatch && pre1Match) {
            return `第${sessionMatch[1]}回-2-${pre1Match[1]}`;
        }

        if (sessionMatch && !problemMatch && !pre1Match) {
            return `第${sessionMatch[1]}回`;
        }

        if (sessionMatch && problemMatch) {
            return `第${sessionMatch[1]}回 ${problemMatch[0]}`;
        }

        return title;
    };

    const renderCard = (item) => {
        const displayTitle = item.title || item.filename.replace('.txt', '');
        const year = getYearFromTitle(displayTitle);
        const compactTitle = getCompactTitle(displayTitle);
        const yearClass = `year-${year}`;
        const isJunkaijo = displayTitle.includes('準会場');

        return (
            <div key={item.originalIndex} className="problem-card-wrapper">
                <div className="problem-card">
                    <div className="card-header">
                        <div className="badge-container">
                            <div className={`year-badge ${yearClass}`}>{year}</div>
                            {isJunkaijo && <div className="junkaijo-badge">準会場</div>}
                        </div>
                        <div className="card-titles">
                            <h3 className="card-title-jp">{compactTitle}</h3>
                            {item.englishTitle && (
                                <div className="card-title-en">{item.englishTitle}</div>
                            )}
                        </div>
                    </div>
                    <div className="card-actions">
                        <Link
                            to={`/quiz/${item.originalIndex}`}
                            className="btn btn-study btn-sm"
                            onClick={saveScrollPosition}
                        >
                            <span className="icon">📖</span>
                            <span>指導書</span>
                        </Link>
                        <button
                            className="btn btn-print btn-sm"
                            onClick={(e) => handlePrint(e, item)}
                            title="スクリーンショットを印刷"
                        >
                            <span className="icon">🖨️</span>
                            <span>印刷</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`home-page bg-${bgIndex}`}>
            <div className="home-container">
                <div className="page-header">
                    <h1 className="page-title">EIKEN Gap-Fill Navigator</h1>
                    <p className="page-subtitle">学習したい問題を選択してください</p>
                </div>

                {/* ナビゲーションボタン */}
                <nav className="grade-nav">
                    {preGrade1.length > 0 && (
                        <a href="#pre-grade1" className="grade-nav-btn pre1">
                            準1級
                            <span className="grade-count">{preGrade1.length}</span>
                        </a>
                    )}
                    {grade2.length > 0 && (
                        <a href="#grade2" className="grade-nav-btn grade2">
                            2級
                            <span className="grade-count">{grade2.length}</span>
                        </a>
                    )}
                    {preGrade2Plus.length > 0 && (
                        <a href="#pre-grade2-plus" className="grade-nav-btn pre2plus">
                            準2級+
                            <span className="grade-count">{preGrade2Plus.length}</span>
                        </a>
                    )}
                    {preGrade2.length > 0 && (
                        <a href="#pre-grade2" className="grade-nav-btn pre2">
                            準2級
                            <span className="grade-count">{preGrade2.length}</span>
                        </a>
                    )}
                </nav>

                {preGrade1.length > 0 && (
                    <section id="pre-grade1">
                        <h2 className="section-title pre1-title">英検準1級</h2>
                        <div className="problem-grid">
                            {preGrade1.map(renderCard)}
                        </div>
                    </section>
                )}

                {grade2.length > 0 && (
                    <section id="grade2">
                        <h2 className="section-title grade2-title">英検2級</h2>
                        <div className="problem-grid">
                            {grade2.map(renderCard)}
                        </div>
                    </section>
                )}

                {preGrade2Plus.length > 0 && (
                    <section id="pre-grade2-plus">
                        <h2 className="section-title pre2plus-title">英検準2級プラス</h2>
                        <div className="problem-grid">
                            {preGrade2Plus.map(renderCard)}
                        </div>
                    </section>
                )}

                {preGrade2.length > 0 && (
                    <section id="pre-grade2">
                        <h2 className="section-title pre2-title">英検準2級</h2>
                        <div className="problem-grid">
                            {preGrade2.map(renderCard)}
                        </div>
                    </section>
                )}

                <footer className="page-footer">
                    © ECCベストワン藍住・北島中央 | タブレット横向き・PC推奨
                </footer>
            </div>
        </div>
    );
}
