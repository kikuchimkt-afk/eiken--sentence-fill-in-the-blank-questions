import React, { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import './QuestionCard.css';

export function QuestionCard({ question }) {
    const [selected, setSelected] = useState(null);

    const handleSelect = (index) => {
        if (selected !== null) return; // Prevent changing answer
        setSelected(index);
    };

    const isCorrect = selected === question.correctAnswer;
    const isAnswered = selected !== null;

    return (
        <div className={`card question-card ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
            <div className="q-header">
                <span className="q-number">({question.number})</span>
                <span className="q-status">
                    {isAnswered ? (
                        isCorrect ? <span className="status-text success">Correct <CheckCircle size={16} /></span>
                            : <span className="status-text error">Incorrect <XCircle size={16} /></span>
                    ) : (
                        <span className="status-text note">Select an answer</span>
                    )}
                </span>
            </div>

            <div className="choices-list">
                {question.choices.map((choice) => {
                    let className = "choice-btn";
                    if (isAnswered) {
                        if (choice.index === question.correctAnswer) className += " correct-choice";
                        else if (choice.index === selected) className += " wrong-choice";
                        else className += " disabled";
                    }

                    return (
                        <button
                            key={choice.index}
                            className={className}
                            onClick={() => handleSelect(choice.index)}
                            disabled={isAnswered}
                        >
                            <span className="choice-index">{choice.index}.</span>
                            <span className="choice-text">{choice.text}</span>
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className="explanation-box">
                    <div className="exp-header">
                        <HelpCircle size={16} />
                        <span>Explanation</span>
                    </div>
                    <p className="exp-text">
                        {question.explanation || "No explanation available."}
                    </p>
                </div>
            )}
        </div>
    );
}
