import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import images
import img62 from "/62.png";
import img63 from "/63.png";
import img64 from "/64.png";
import img65 from "/65.png";
import img66 from "/66.png";

const RulesScreen = () => {
  const navigate = useNavigate();

  // Enable scrolling on this page, disable when leaving
  useEffect(() => {
    // Save original styles
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalRootOverflow =
      document.getElementById("root")?.style.overflow;

    // Enable scrolling
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    if (document.getElementById("root")) {
      document.getElementById("root").style.overflow = "auto";
    }

    // Cleanup - restore original styles
    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      if (document.getElementById("root")) {
        document.getElementById("root").style.overflow =
          originalRootOverflow || "";
      }
    };
  }, []);

  const sections = [
    {
      title: "🎯 Objective",
      content: "Be the first to get rid of all your cards!",
      color: "#f1c40f",
      image: img62,
    },
    {
      title: "🃏 Card Types",
      content: `• Joy (Yellow) - Fun activities
• Passion (Red) - Romantic challenges  
• Care (Blue) - Caring tasks
• Growth (Green) - Deep conversations
• Wild (Purple) - Special effects`,
      color: "#9b59b6",
      image: img63,
    },
    {
      title: "🎮 How to Play",
      content: `1. Match cards by COLOR or VALUE
2. Play a card and do its task
3. Record VIDEO or AUDIO proof
4. Partner verifies your task
5. Can't play? Draw a card!`,
      color: "#3498db",
      image: img64,
    },
    {
      title: "⚡ Wild Cards",
      content: `• Wild - Choose next color
• Wild +4 - Opponent draws 4
• Skip - Play again!
• Swap - Exchange cards`,
      color: "#e74c3c",
      image: img65,
    },
    {
      title: "✅ Verification",
      content: `• YES = Task done, turn passes
• NO = Player draws 2 penalty cards`,
      color: "#27ae60",
      image: img66,
    },
  ];

  return (
    <div className="rules-screen">
      {/* Header */}
      <header className="rules-header">
        <button onClick={() => navigate("/")} className="rules-back-btn">
          ←
        </button>
        <h1>Game Rules</h1>
      </header>

      {/* Scrollable Content */}
      <main className="rules-content">
        <div className="rules-container">
          {sections.map((section, i) => (
            <div
              key={i}
              className="rules-section"
              style={{ borderLeftColor: section.color }}
            >
              {/* Section Image */}
              {section.image && (
                <div className="rules-image-wrapper">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="rules-image"
                    loading="lazy"
                  />
                </div>
              )}

              <h3 style={{ color: section.color }}>{section.title}</h3>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <footer className="rules-footer">
        <div className="rules-container">
          <button onClick={() => navigate("/")} className="btn btn-secondary">
            ← Back to Menu
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RulesScreen;
