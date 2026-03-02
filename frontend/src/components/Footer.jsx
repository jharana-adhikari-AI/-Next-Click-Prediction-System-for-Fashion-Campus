import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🛍</span>
              Fashion Campus
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Next-Click Prediction System powered by Machine Learning.
              Combining Markov Chain, GRU Neural Networks, and Word2Vec
              to predict user behavior with 44,424 fashion products.
            </p>
            <div className="flex gap-4 mt-4">
              <span className="px-3 py-1 bg-indigo-600 rounded-full text-xs font-semibold">Markov Chain</span>
              <span className="px-3 py-1 bg-purple-600 rounded-full text-xs font-semibold">GRU</span>
              <span className="px-3 py-1 bg-pink-600 rounded-full text-xs font-semibold">Word2Vec</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors no-underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-slate-300 hover:text-white transition-colors no-underline">
                  Product Catalog
                </Link>
              </li>
              <li>
                <Link to="/predict" className="text-slate-300 hover:text-white transition-colors no-underline">
                  Make Predictions
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-slate-300 hover:text-white transition-colors no-underline">
                  Compare Models
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-white transition-colors no-underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Made by Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Made by</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                  Jharana Adhikari
                </p>
                <p className="text-xs text-slate-400 mt-1">Full-Stack ML Engineer</p>
              </div>

              <div className="space-y-2 text-sm">
                <a
                  href="tel:+14376031674"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors no-underline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  +1 (437) 603-1674
                </a>

                <a
                  href="mailto:jharanaadk@gmail.com"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors no-underline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  jharanaadk@gmail.com
                </a>

                <a
                  href="https://jharana.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors no-underline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  jharana.vercel.app
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.linkedin.com/in/jharana-adhikari"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-700 hover:bg-indigo-600 rounded-lg transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>

                <a
                  href="https://github.com/jharana-adhikari-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-700 hover:bg-purple-600 rounded-lg transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

              <div className="pt-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-sm font-semibold transition-all no-underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-400">
          <p>
            © {new Date().getFullYear()} Jharana Adhikari. All rights reserved. |
            <span className="text-slate-500"> Built with React, FastAPI, TensorFlow & ❤️</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
