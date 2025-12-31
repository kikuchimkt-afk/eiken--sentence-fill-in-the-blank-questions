import React from 'react';
import './Layout.css';

export function Layout({ children }) {

    return (
        <div className="layout">
            <main className="main-content container">
                {children}
            </main>

            <footer className="footer">
                <div className="container">
                    <p>© ECCベストワン藍住・北島中央</p>
                </div>
            </footer>
        </div>
    );
}
