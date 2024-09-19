import React, { useState, useEffect, useRef } from "react";
import config from "./config.json";
import "./App.css";

function App() {
  const [birdPosition, setBirdPosition] = useState(config.bird.position.y);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [pipes, setPipes] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScores, setBestScores] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const gameLoop = useRef(null);
  const pipeGenerator = useRef(null);

  // Oyun döngüsü
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoop.current = setInterval(() => {
        setBirdVelocity((prevVelocity) => {
          let newVelocity = prevVelocity + config.bird.gravity;
          // Maksimum düşme hızını sınırla
          if (newVelocity > config.bird.maxFallSpeed) {
            newVelocity = config.bird.maxFallSpeed;
          }
          return newVelocity;
        });

        setBirdPosition((prevPosition) => {
          const newPosition = prevPosition + birdVelocity;
          return newPosition;
        });
      }, 20);
    }
    return () => clearInterval(gameLoop.current);
  }, [gameStarted, gameOver, birdVelocity]);

  // Boruları oluşturma
  useEffect(() => {
    if (gameStarted && !gameOver) {
      pipeGenerator.current = setInterval(() => {
        const topPipeHeight = Math.floor(
          Math.random() * (config.game.height - config.pipe.gap)
        );
        setPipes((prev) => [
          ...prev,
          {
            x: config.game.width,
            topHeight: topPipeHeight,
            bottomHeight: config.game.height - topPipeHeight - config.pipe.gap,
          },
        ]);
      }, config.pipe.interval);
    }
    return () => clearInterval(pipeGenerator.current);
  }, [gameStarted, gameOver]);

  // Boruları hareket ettirme ve skoru artırma
  useEffect(() => {
    let pipesMovement;
    if (gameStarted && !gameOver) {
      pipesMovement = setInterval(() => {
        setPipes((prev) => {
          const newPipes = prev.map((pipe) => ({
            ...pipe,
            x: pipe.x - config.pipe.speed,
          }));
          return newPipes;
        });
        // Kuş boruyu geçtiyse skoru artır
        setPipes((prev) => {
          if (
            prev.length > 0 &&
            prev[0].x + config.pipe.width < config.bird.position.x
          ) {
            setScore((prevScore) => prevScore + 1);
            return prev.slice(1);
          }
          return prev;
        });
      }, 20);
    }
    return () => clearInterval(pipesMovement);
  }, [pipes, gameStarted, gameOver]);

  // Çarpışma Algılama
  useEffect(() => {
    if (pipes.length > 0) {
      const birdWidth = 40;
      const birdHeight = 30;
      const birdLeft = config.bird.position.x;
      const birdRight = birdLeft + birdWidth;
      const birdTop = birdPosition;
      const birdBottom = birdPosition + birdHeight;

      pipes.forEach((pipe) => {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + config.pipe.width;

        // Çarpışma kontrolü
        if (
          birdRight > pipeLeft &&
          birdLeft < pipeRight &&
          (birdTop < pipe.topHeight ||
            birdBottom > config.game.height - pipe.bottomHeight)
        ) {
          setGameOver(true);
          setGameStarted(false);
        }
      });

      // Kuş yerden veya tavandan çıktıysa
      if (birdTop <= 0 || birdBottom >= config.game.height) {
        setGameOver(true);
        setGameStarted(false);
      }
    }
  }, [birdPosition, pipes]);

  // Oyuncu ismini alma ve skoru kaydetme
  useEffect(() => {
    if (gameOver) {
      const savedName = localStorage.getItem("playerName") || "";
      const name = prompt("Oyun Bitti! İsminizi girin:", savedName);
      if (name) {
        setPlayerName(name);
        localStorage.setItem("playerName", name);
        saveScore(name, score);
      }
    }
  }, [gameOver]);

  const saveScore = (name, score) => {
    const existingScores = JSON.parse(localStorage.getItem("bestScores")) || [];
    const newScores = [...existingScores, { name, score }];
    // Skorları sıralayıp en iyi 10 skoru al
    newScores.sort((a, b) => b.score - a.score);
    const topScores = newScores.slice(0, 10);
    localStorage.setItem("bestScores", JSON.stringify(topScores));
    setBestScores(topScores);
  };

  // En iyi skorları yükle
  useEffect(() => {
    const savedScores = JSON.parse(localStorage.getItem("bestScores")) || [];
    setBestScores(savedScores);
  }, []);

  // Kuşun zıplaması
  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    if (!gameOver) {
      setBirdVelocity(config.bird.jumpStrength);
    }
  };

  // Oyunu yeniden başlatma
  const restartGame = () => {
    setBirdPosition(config.bird.position.y);
    setBirdVelocity(0);
    setPipes([]);
    setGameOver(false);
    setGameStarted(false);
    setScore(0);
  };

  // Klavye ve fare etkileşimi
  useEffect(() => {
    const handleSpacebar = (e) => {
      if (e.code === "Space") {
        handleJump();
      }
    };
    window.addEventListener("keydown", handleSpacebar);
    return () => window.removeEventListener("keydown", handleSpacebar);
  });

  return (
    <div className="game-wrapper">
      <div
        className="game-container"
        onClick={handleJump}
        style={{ width: config.game.width, height: config.game.height }}
      >
        {!gameOver && (
          <div
            className="bird"
            style={{
              top: birdPosition,
              left: config.bird.position.x,
            }}
          ></div>
        )}
        {pipes.map((pipe, index) => (
          <div key={index}>
            <div
              className="pipe top-pipe"
              style={{
                height: pipe.topHeight,
                left: pipe.x,
                width: config.pipe.width,
              }}
            ></div>
            <div
              className="pipe bottom-pipe"
              style={{
                height: pipe.bottomHeight,
                left: pipe.x,
                width: config.pipe.width,
                top: config.game.height - pipe.bottomHeight,
              }}
            ></div>
          </div>
        ))}
        {gameOver && (
          <div className="game-over">
            <h1>Oyun Bitti</h1>
            <button onClick={restartGame}>Yeniden Başlat</button>
          </div>
        )}
      </div>
      <div className="side-panel">
        <h2>Skor: {score}</h2>
        <h3>En İyi 10 Skor</h3>
        <ol>
          {bestScores.map((item, index) => (
            <li key={index}>
              {item.name}: {item.score}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default App;
