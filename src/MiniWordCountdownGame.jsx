import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, RotateCcw, SkipForward, Check, Trophy,
  Clock, Settings, X, ChevronRight, Users, Package,
  Pause, Edit3, Trash2, Plus, Save, ArrowLeft, Lock, CheckCircle,
} from "lucide-react";

// ─── DEFAULT DATA ────────────────────────────────────────────────────────────

const DEFAULT_PACKAGES = [
  {
    id: "pkg-1",
    name: "Bộ câu hỏi Bản lĩnh vươn mình",
    shortName: "Bản lĩnh vươn mình",
    color: "#e63946",
    questions: [
      "Theo cách của bạn",
      "Chuyển đổi số",
      "Kỷ nguyên vươn mình",
      "Tự chủ công nghệ",
      "Có công mài sắt",
      "Đi một ngày đàng",
      "Một cây làm chẳng nên non",
      "Ăn quả nhớ kẻ trồng cây",
      "Thương người như thể thương thân",
      "Tre già măng mọc",
      "Cá lớn nuốt cá bé",
      "Há miệng chờ sung",
      "Mắt chữ A miệng chữ O",
      "Đầu voi đuôi chuột",
      "Nước đến chân mới nhảy",
    ],
  },
  {
    id: "pkg-2",
    name: "Bộ câu hỏi Sức sống tiên phong",
    shortName: "Sức sống tiên phong",
    color: "#2a9d8f",
    questions: [
      "Tiên phong công nghệ số",
      "Sáng tạo là sức sống",
      "Trưởng thành qua những thách thức và thất bại",
      "Kết hợp Đông Tây",
      "Kết nối mọi người",
      "Nói có sách mách có chứng",
      "Đứng núi này trông núi nọ",
      "Chúng tôi là chiến sĩ",
      "Trẻ em như búp trên cành",
      "Ngất xỉu",
      "Con bò cười",
      "Thể dục thể thao",
      "Cô gái mở đường",
      "Ba mươi bảy năm",
      "Chạy mất dép",
    ],
  },
  {
    id: "pkg-3",
    name: "Bộ câu hỏi Lửa thử vàng",
    shortName: "Lửa thử vàng",
    color: "#f4a261",
    questions: [
      "Viettel ngôi nhà chung",
      "Hành khúc ngày và đêm",
      "Vươn tầm thế giới",
      "Lửa thử vàng, gian nan thử sức",
      "Uống nước nhớ nguồn",
      "Cười như được mùa",
      "Ếch ngồi đáy giếng",
      "Lá lành đùm lá rách",
      "Gần mực thì đen, gần đèn thì sáng",
      "Nhanh như chớp",
      "Thần tốc hơn",
      "Táo bạo hơn",
      "Chủ động hơn",
      "Vỗ tay chúc mừng",
      "Làm việc nhóm",
    ],
  },
  {
    id: "pkg-4",
    name: "Bộ câu hỏi Vượt lên thử thách",
    shortName: "Vượt lên thử thách",
    color: "#6a0dad",
    questions: [
      "Gọi điện thoại",
      "Mất sóng",
      "Sạc pin điện thoại",
      "Quét mã QR",
      "Cười không nhặt được mồm",
      "Thả diều",
      "Thất bại là mẹ thành công",
      "Đói cho sạch, rách cho thơm",
      "Rước đèn Trung thu",
      "Rồng rắn lên mây",
      "Có chí thì nên",
      "Thua keo này bày keo khác",
      "Không thầy đố mày làm nên",
      "Năm anh em trên một chiếc xe tăng",
      "Học thầy không tày học bạn",
    ],
  },
];

const DEFAULT_TEAMS = [
  { id: "team-1", name: "Đội 1", durationSeconds: 300, packageId: null },
  { id: "team-2", name: "Đội 2", durationSeconds: 300, packageId: null },
  { id: "team-3", name: "Đội 3", durationSeconds: 300, packageId: null },
  { id: "team-4", name: "Đội 4", durationSeconds: 300, packageId: null },
];

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
// "selection" → "game" → "finished"
// + "admin" overlay

export default function MiniWordCountdownGame() {
  // ── core state ──
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [teams, setTeams] = useState(DEFAULT_TEAMS);

  // selection phase: which team is currently picking
  const [selectingTeamIndex, setSelectingTeamIndex] = useState(0);
  const [screen, setScreen] = useState("selection"); // "selection" | "game" | "finished"

  // game phase
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [correctIds, setCorrectIds] = useState([]);
  const [skippedIds, setSkippedIds] = useState([]);

  // admin
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("teams"); // "teams" | "packages"
  const [editingPackageIndex, setEditingPackageIndex] = useState(null);

  // derived
  const activeTeam = teams[activeTeamIndex];
  const activePkg = packages.find((p) => p.id === activeTeam?.packageId) || packages[0];
  const questions = activePkg?.questions || [];
  const currentQuestion = questions[questionIndex];
  const correctCount = correctIds.length;
  const totalQuestions = questions.length;
  const progress = Math.max(0, Math.min(100, (timeLeft / activeTeam?.durationSeconds) * 100));

  // locked packages = any package already chosen by a team
  const lockedPackageIds = teams
    .filter((t) => t.packageId !== null)
    .map((t) => t.packageId);

  // ── timer ──
  useEffect(() => {
    if (!running || finished) return;
    if (timeLeft <= 0) {
      setFinished(true);
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft, finished]);

  // auto-finish when all correct
  useEffect(() => {
    if (running && correctIds.length > 0 && correctIds.length >= totalQuestions) {
      setFinished(true);
      setRunning(false);
    }
  }, [correctIds, totalQuestions, running]);

  // ── helpers ──
  function getQId(idx = questionIndex) {
    return `${activeTeam?.id}-${activePkg?.id}-${idx}`;
  }

  function findNextQuestion(from = questionIndex) {
    for (let step = 1; step <= questions.length; step++) {
      const next = (from + step) % questions.length;
      if (!correctIds.includes(getQId(next))) return next;
    }
    return from;
  }

  function handleMarkCorrect() {
    if (finished || !currentQuestion) return;
    const id = getQId();
    const next = correctIds.includes(id) ? correctIds : [...correctIds, id];
    setCorrectIds(next);
    if (next.length >= totalQuestions) {
      setFinished(true);
      setRunning(false);
      return;
    }
    setQuestionIndex(findNextQuestion());
  }

  function handleSkip() {
    if (finished || !currentQuestion) return;
    const id = getQId();
    if (!skippedIds.includes(id)) setSkippedIds((s) => [...s, id]);
    setQuestionIndex(findNextQuestion());
  }

  function startTeamGame(teamIdx) {
    const t = teams[teamIdx];
    setActiveTeamIndex(teamIdx);
    setQuestionIndex(0);
    setTimeLeft(t.durationSeconds);
    setRunning(false);
    setFinished(false);
    setCorrectIds([]);
    setSkippedIds([]);
    setScreen("game");
  }

  function handleSelectPackage(pkgId) {
    const currentTeamIdx = selectingTeamIndex;
    // Update teams state then immediately start this team's game
    setTeams((prev) =>
      prev.map((t, i) => (i === currentTeamIdx ? { ...t, packageId: pkgId } : t))
    );
    // Start game for current team right after picking
    const teamWithPkg = { ...teams[currentTeamIdx], packageId: pkgId };
    setActiveTeamIndex(currentTeamIdx);
    setQuestionIndex(0);
    setTimeLeft(teamWithPkg.durationSeconds);
    setRunning(false);
    setFinished(false);
    setCorrectIds([]);
    setSkippedIds([]);
    setScreen("game");
    // Next time we return to selection, advance to next team
    if (currentTeamIdx + 1 < teams.length) {
      setSelectingTeamIndex(currentTeamIdx + 1);
    }
  }

  function resetAll() {
    setTeams((prev) => prev.map((t) => ({ ...t, packageId: null })));
    setSelectingTeamIndex(0);
    setScreen("selection");
    setRunning(false);
    setFinished(false);
    setCorrectIds([]);
    setSkippedIds([]);
  }

  // Go back to selection but KEEP packageIds (package stays locked)
  function goBackToSelection() {
    setScreen("selection");
    setRunning(false);
    setFinished(false);
    setCorrectIds([]);
    setSkippedIds([]);
  }

  function resetCurrentTeam() {
    setQuestionIndex(0);
    setTimeLeft(activeTeam.durationSeconds);
    setRunning(false);
    setFinished(false);
    setCorrectIds([]);
    setSkippedIds([]);
  }

  function switchToTeam(idx) {
    startTeamGame(idx);
  }

  // ── RENDER ──
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>
      {/* Full-screen background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/bg-minigame.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,10,0.55) 0%, rgba(10,0,40,0.6) 100%)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh" }}>
        <AnimatePresence mode="wait">
          {screen === "selection" && (
            <SelectionScreen
              key="selection"
              teams={teams}
              packages={packages}
              selectingTeamIndex={selectingTeamIndex}
              lockedPackageIds={lockedPackageIds}
              onSelectPackage={handleSelectPackage}
              onOpenAdmin={() => setAdminOpen(true)}
            />
          )}
          {screen === "game" && (
            <GameScreen
              key="game"
              teams={teams}
              activeTeam={activeTeam}
              activeTeamIndex={activeTeamIndex}
              activePkg={activePkg}
              currentQuestion={currentQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              correctCount={correctCount}
              skippedCount={skippedIds.length}
              timeLeft={timeLeft}
              running={running}
              finished={finished}
              progress={progress}
              correctIds={correctIds}
              getQId={getQId}
              onStart={() => setRunning(true)}
              onTogglePause={() => setRunning((v) => !v)}
              onMarkCorrect={handleMarkCorrect}
              onSkip={handleSkip}
              onReset={resetCurrentTeam}
              onSwitchTeam={switchToTeam}
              onResetAll={resetAll}
              onGoBack={goBackToSelection}
              onOpenAdmin={() => setAdminOpen(true)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {adminOpen && (
          <AdminScreen
            teams={teams}
            packages={packages}
            adminTab={adminTab}
            editingPackageIndex={editingPackageIndex}
            setAdminTab={setAdminTab}
            setEditingPackageIndex={setEditingPackageIndex}
            setTeams={setTeams}
            setPackages={setPackages}
            onClose={() => setAdminOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SELECTION SCREEN ─────────────────────────────────────────────────────────
function SelectionScreen({ teams, packages, selectingTeamIndex, lockedPackageIds, onSelectPackage, onOpenAdmin }) {
  const currentTeam = teams[selectingTeamIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <p style={{ color: "#ffd700", fontWeight: 700, letterSpacing: "0.25em", fontSize: 13, textTransform: "uppercase", margin: 0 }}>
            Mini Game · Countdown Quiz Arena
          </p>
          <h1 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, margin: "6px 0 0", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            Chọn Gói Câu Hỏi
          </h1>
        </div>
        <button onClick={onOpenAdmin} style={styles.iconBtn} title="Admin">
          <Settings size={20} />
        </button>
      </div>

      {/* Team Progress */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
        {teams.map((t, i) => {
          const pkg = packages.find((p) => p.id === t.packageId);
          const isActive = i === selectingTeamIndex;
          const isDone = t.packageId !== null;
          return (
            <motion.div
              key={t.id}
              animate={{ scale: isActive ? 1.05 : 1 }}
              style={{
                padding: "10px 18px",
                borderRadius: 16,
                background: isActive
                  ? "rgba(255,215,0,0.25)"
                  : isDone
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.06)",
                border: isActive ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.15)",
                color: "#fff",
                minWidth: 140,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                {isDone && <CheckCircle size={14} style={{ marginRight: 6, color: "#4ade80", verticalAlign: "middle" }} />}
                {t.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                {isDone ? pkg?.shortName : isActive ? "Đang chọn..." : "Chờ đến lượt"}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Current team indicator */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            color: "#000",
            fontWeight: 900,
            fontSize: "clamp(18px, 3vw, 26px)",
            padding: "12px 32px",
            borderRadius: 50,
            boxShadow: "0 4px 24px rgba(255,215,0,0.4)",
          }}
        >
          👉 {currentTeam.name} – Hãy chọn gói câu hỏi!
        </motion.div>
      </div>

      {/* Package Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 20,
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
      }}>
        {packages.map((pkg) => {
          const isLocked = lockedPackageIds.includes(pkg.id);
          const lockedByTeam = teams.find((t) => t.packageId === pkg.id);
          return (
            <motion.div
              key={pkg.id}
              whileHover={!isLocked ? { scale: 1.04, y: -4 } : {}}
              whileTap={!isLocked ? { scale: 0.97 } : {}}
              onClick={() => !isLocked && onSelectPackage(pkg.id)}
              style={{
                borderRadius: 24,
                background: isLocked
                  ? "rgba(255,255,255,0.05)"
                  : `linear-gradient(135deg, ${pkg.color}cc, ${pkg.color}88)`,
                border: isLocked ? "2px solid rgba(255,255,255,0.1)" : `2px solid ${pkg.color}`,
                padding: "28px 24px",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.5 : 1,
                backdropFilter: "blur(12px)",
                boxShadow: isLocked ? "none" : `0 8px 32px ${pkg.color}44`,
                transition: "box-shadow 0.3s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isLocked && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.4)", borderRadius: 24, zIndex: 2,
                }}>
                  <Lock size={32} color="#fff" />
                  <p style={{ color: "#fff", fontWeight: 700, margin: "8px 0 0", fontSize: 15 }}>
                    Đã chọn bởi {lockedByTeam?.name}
                  </p>
                </div>
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Package size={24} color="#fff" />
                </div>
                <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: "0 0 6px", lineHeight: 1.3 }}>
                  {pkg.shortName}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0 }}>
                  {pkg.questions.length} câu hỏi
                </p>

              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── GAME SCREEN ──────────────────────────────────────────────────────────────
function GameScreen({
  teams, activeTeam, activeTeamIndex, activePkg, currentQuestion,
  questionIndex, totalQuestions, correctCount, skippedCount,
  timeLeft, running, finished, progress, correctIds, getQId,
  onStart, onTogglePause, onMarkCorrect, onSkip, onReset,
  onSwitchTeam, onResetAll, onGoBack, onOpenAdmin,
}) {
  const timePercent = progress;
  const isUrgent = timeLeft <= 30 && !finished;
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onResetAll} style={{ ...styles.iconBtn, fontSize: 13 }} title="Về màn hình chọn gói">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Đang thi đấu
            </p>
            <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 18 }}>
              {activeTeam.name} · {activePkg.shortName}
            </p>
          </div>
        </div>

        {/* Team switcher */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {teams.map((t, i) => (
            <button
              key={t.id}
              onClick={() => onSwitchTeam(i)}
              style={{
                padding: "6px 14px",
                borderRadius: 12,
                border: i === activeTeamIndex ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.2)",
                background: i === activeTeamIndex ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.08)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <button onClick={onOpenAdmin} style={styles.iconBtn} title="Admin">
          <Settings size={20} />
        </button>
      </div>

      {/* Timer bar */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.1)" }}>
        <motion.div
          animate={{ width: `${timePercent}%` }}
          transition={{ duration: 0.4 }}
          style={{
            height: "100%",
            background: isUrgent
              ? "linear-gradient(90deg, #ff4444, #ff8800)"
              : "linear-gradient(90deg, #4ade80, #22d3ee)",
            boxShadow: isUrgent ? "0 0 12px #ff4444" : "0 0 8px #4ade80",
          }}
        />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", alignItems: "stretch", padding: 24, gap: 24 }}>
        {/* Question area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>

          {/* ── ALWAYS VISIBLE: Timer + Progress ── */}
          {!finished && (
            <div style={{ textAlign: "center", marginBottom: 20, width: "100%", maxWidth: 800 }}>
              <motion.div
                animate={isUrgent ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.6 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: isUrgent ? "rgba(255,60,60,0.3)" : "rgba(0,0,0,0.5)",
                  border: isUrgent ? "2px solid #ff4444" : "2px solid rgba(255,255,255,0.2)",
                  borderRadius: 50,
                  padding: "10px 28px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Clock size={22} color={isUrgent ? "#ff6666" : "#22d3ee"} />
                <span style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: isUrgent ? "#ff6666" : "#fff",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.05em",
                }}>
                  {formatTime(timeLeft)}
                </span>
              </motion.div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 20,
                marginTop: 14,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
                borderRadius: 50,
                padding: "10px 28px",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: "0.05em" }}>
                  Câu <span style={{ color: "#ffd700", fontSize: 26 }}>{Math.min(questionIndex + 1, totalQuestions)}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>/</span>
                  {totalQuestions}
                </span>
                <span style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)" }} />
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                  Đúng: <span style={{ color: "#4ade80", fontSize: 26 }}>{correctCount}</span>
                </span>
              </div>
            </div>
          )}

          {/* ── ANIMATED: Question card only ── */}
          <AnimatePresence mode="wait">
            {finished ? (
              <FinishedCard
                key="fin"
                correctCount={correctCount}
                skippedCount={skippedCount}
                totalQuestions={totalQuestions}
                onReset={onReset}
                onGoBack={onGoBack}
              />
            ) : (
              <motion.div
                key={`q-${questionIndex}`}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -30 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                style={{ textAlign: "center", width: "100%", maxWidth: 800 }}
              >
                <div style={{
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 28,
                  border: "2px solid rgba(255,255,255,0.15)",
                  padding: "clamp(24px, 5vw, 56px) clamp(20px, 5vw, 60px)",
                  boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
                }}>
                  <h2 style={{
                    color: "#fff",
                    fontSize: "clamp(28px, 6vw, 72px)",
                    fontWeight: 900,
                    margin: 0,
                    lineHeight: 1.15,
                    textShadow: "0 2px 24px rgba(0,0,0,0.6)",
                    wordBreak: "break-word",
                  }}>
                    {currentQuestion || "—"}
                  </h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ALWAYS VISIBLE: Control buttons ── */}
          {!finished && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
              {!running && !finished ? (
                <GlowButton onClick={onStart} color="#4ade80" icon={<Play size={22} />} label="Bắt đầu" />
              ) : (
                <GlowButton
                  onClick={onTogglePause}
                  disabled={finished}
                  color={running ? "#fbbf24" : "#22d3ee"}
                  icon={running ? <Pause size={22} /> : <Play size={22} />}
                  label={running ? "Tạm dừng" : "Tiếp tục"}
                />
              )}
              <GlowButton
                onClick={onMarkCorrect}
                disabled={finished || !currentQuestion}
                color="#4ade80"
                icon={<Check size={22} />}
                label="Đúng"
              />
              <GlowButton
                onClick={onSkip}
                disabled={finished || !currentQuestion}
                color="#94a3b8"
                icon={<SkipForward size={22} />}
                label="Bỏ qua"
                secondary
              />
              <GlowButton
                onClick={onReset}
                color="#f87171"
                icon={<RotateCcw size={20} />}
                label="Reset"
                secondary
              />
            </div>
          )}
        </div>

        {/* Question list sidebar with toggle */}
        <div style={{ position: "relative", display: "flex", alignItems: "stretch", flexShrink: 0 }}>

          {/* Toggle button */}
          <button
            onClick={() => setShowSidebar((v) => !v)}
            title={showSidebar ? "Ẩn danh sách câu" : "Hiện danh sách câu"}
            style={{
              position: "absolute",
              left: showSidebar ? -18 : -18,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 28,
              height: 56,
              borderRadius: "12px 0 0 12px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRight: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
          >
            {showSidebar ? "›" : "‹"}
          </button>

          {/* Sidebar panel */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                style={{
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 220,
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(16px)",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: 16,
                  overflowY: "auto",
                  maxHeight: "calc(100vh - 120px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  height: "100%",
                }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px" }}>
                    Danh sách câu
                  </p>
                  {(activePkg?.questions || []).map((q, i) => {
                    const id = getQId(i);
                    const isDone = correctIds.includes(id);
                    const isCurrent = i === questionIndex;
                    return (
                      <div
                        key={i}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: isCurrent ? 700 : 400,
                          background: isDone
                            ? "rgba(74,222,128,0.15)"
                            : isCurrent
                            ? "rgba(255,215,0,0.2)"
                            : "rgba(255,255,255,0.05)",
                          color: isDone ? "#4ade80" : isCurrent ? "#ffd700" : "rgba(255,255,255,0.7)",
                          border: isCurrent ? "1px solid #ffd700" : "1px solid transparent",
                          wordBreak: "break-word",
                          lineHeight: 1.4,
                        }}
                      >
                        {isDone && "✓ "}{i + 1}. {q}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FINISHED CARD ────────────────────────────────────────────────────────────
function FinishedCard({ correctCount, skippedCount, totalQuestions, onReset, onGoBack }) {
  return (
    <motion.div
      key="finished"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(24px)",
        borderRadius: 32,
        border: "2px solid rgba(255,215,0,0.4)",
        padding: "48px 56px",
        textAlign: "center",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        maxWidth: 520,
        width: "100%",
      }}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{ fontSize: 80, marginBottom: 16 }}
      >
        🏆
      </motion.div>

      <h2 style={{ color: "#ffd700", fontSize: 36, fontWeight: 900, margin: "0 0 8px" }}>
        Kết thúc lượt thi!
      </h2>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", margin: "28px 0" }}>
        <StatBox label="Đúng" value={correctCount} color="#4ade80" />
        <StatBox label="Bỏ qua" value={skippedCount} color="#fbbf24" />
        <StatBox label="Tổng" value={totalQuestions} color="#94a3b8" />
      </div>

      {/* Confirm return */}
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 20 }}>
        Nhấn xác nhận để chuyển về màn chọn gói
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGoBack}
          style={{
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            border: "none", borderRadius: 16, color: "#000",
            fontWeight: 900, fontSize: 16, padding: "14px 36px",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 24px rgba(255,215,0,0.4)",
          }}
        >
          <CheckCircle size={20} /> Xác nhận về chọn gói
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, color: "#fff",
            fontWeight: 700, fontSize: 15, padding: "14px 28px",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >
          <RotateCcw size={16} /> Chơi lại
        </motion.button>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.08)", borderRadius: 16,
      padding: "16px 24px", minWidth: 90,
    }}>
      <p style={{ margin: 0, color, fontSize: 32, fontWeight: 900 }}>{value}</p>
      <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{label}</p>
    </div>
  );
}

// ─── GLOW BUTTON ─────────────────────────────────────────────────────────────
function GlowButton({ onClick, disabled, color, icon, label, secondary }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.06, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "14px 28px",
        borderRadius: 16,
        border: secondary ? `2px solid ${color}55` : "none",
        background: secondary ? `${color}18` : `linear-gradient(135deg, ${color}, ${color}bb)`,
        color: secondary ? color : "#000",
        fontWeight: 800,
        fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: secondary || disabled ? "none" : `0 4px 20px ${color}55`,
        transition: "all 0.2s",
      }}
    >
      {icon} {label}
    </motion.button>
  );
}

// ─── ADMIN SCREEN ─────────────────────────────────────────────────────────────
function AdminScreen({ teams, packages, adminTab, editingPackageIndex, setAdminTab, setEditingPackageIndex, setTeams, setPackages, onClose }) {
  const [localTeams, setLocalTeams] = useState(teams.map((t) => ({ ...t })));
  const [localPackages, setLocalPackages] = useState(packages.map((p) => ({ ...p, questions: [...p.questions] })));
  const [newQuestion, setNewQuestion] = useState("");

  function saveAll() {
    setTeams(localTeams);
    setPackages(localPackages);
    onClose();
  }

  function updateTeamField(i, field, value) {
    setLocalTeams((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: field === "durationSeconds" ? Math.max(10, Number(value)) : value } : t));
  }

  function updatePackageName(i, value) {
    setLocalPackages((prev) => prev.map((p, idx) => idx === i ? { ...p, name: value, shortName: value.replace(/^Bộ câu hỏi\s*/i, "") } : p));
  }

  function updateQuestion(pkgIdx, qIdx, value) {
    setLocalPackages((prev) => prev.map((p, i) => {
      if (i !== pkgIdx) return p;
      const qs = [...p.questions];
      qs[qIdx] = value;
      return { ...p, questions: qs };
    }));
  }

  function deleteQuestion(pkgIdx, qIdx) {
    setLocalPackages((prev) => prev.map((p, i) => {
      if (i !== pkgIdx) return p;
      return { ...p, questions: p.questions.filter((_, qi) => qi !== qIdx) };
    }));
  }

  function addQuestion(pkgIdx) {
    if (!newQuestion.trim()) return;
    setLocalPackages((prev) => prev.map((p, i) => {
      if (i !== pkgIdx) return p;
      return { ...p, questions: [...p.questions, newQuestion.trim()] };
    }));
    setNewQuestion("");
  }

  const pkg = editingPackageIndex !== null ? localPackages[editingPackageIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,5,0.85)",
        backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Admin header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {editingPackageIndex !== null && (
            <button onClick={() => setEditingPackageIndex(null)} style={styles.iconBtn}>
              <ArrowLeft size={18} />
            </button>
          )}
          <Settings size={20} color="#ffd700" />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>
            {editingPackageIndex !== null ? `Sửa: ${pkg?.shortName}` : "Chế độ Admin"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={saveAll}
            style={{
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              border: "none", borderRadius: 12, color: "#000",
              fontWeight: 800, fontSize: 14, padding: "10px 24px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Save size={16} /> Lưu & Đóng
          </button>
          <button onClick={onClose} style={styles.iconBtn}><X size={20} /></button>
        </div>
      </div>

      {/* Tab bar (only if not editing a package) */}
      {editingPackageIndex === null && (
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {[{ id: "teams", label: "Đội thi", icon: <Users size={16} /> }, { id: "packages", label: "Gói câu hỏi", icon: <Package size={16} /> }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              style={{
                padding: "14px 24px",
                border: "none",
                borderBottom: adminTab === tab.id ? "3px solid #ffd700" : "3px solid transparent",
                background: "transparent",
                color: adminTab === tab.id ? "#ffd700" : "rgba(255,255,255,0.5)",
                fontWeight: 700, fontSize: 14,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        {editingPackageIndex !== null && pkg ? (
          /* ── Edit package questions ── */
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
              <label style={styles.label}>Tên gói câu hỏi</label>
              <input
                value={pkg.name}
                onChange={(e) => updatePackageName(editingPackageIndex, e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Danh sách câu hỏi ({pkg.questions.length} câu)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {pkg.questions.map((q, qi) => (
                  <div key={qi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, minWidth: 24 }}>{qi + 1}.</span>
                    <input
                      value={q}
                      onChange={(e) => updateQuestion(editingPackageIndex, qi, e.target.value)}
                      style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                    />
                    <button
                      onClick={() => deleteQuestion(editingPackageIndex, qi)}
                      style={{ ...styles.iconBtn, color: "#f87171", borderColor: "#f8717133" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuestion(editingPackageIndex)}
                placeholder="Thêm câu hỏi mới..."
                style={{ ...styles.input, flex: 1, marginBottom: 0 }}
              />
              <button
                onClick={() => addQuestion(editingPackageIndex)}
                style={{
                  background: "rgba(74,222,128,0.2)", border: "1px solid #4ade80",
                  borderRadius: 12, color: "#4ade80", padding: "10px 18px",
                  cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Plus size={16} /> Thêm
              </button>
            </div>
          </div>
        ) : adminTab === "teams" ? (
          /* ── Team settings ── */
          <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {localTeams.map((t, i) => (
              <div key={t.id} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, padding: 20,
              }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, letterSpacing: "0.2em", margin: "0 0 12px", textTransform: "uppercase" }}>
                  Đội {i + 1}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={styles.label}>Tên đội</label>
                    <input
                      value={t.name}
                      onChange={(e) => updateTeamField(i, "name", e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Thời gian (giây)</label>
                    <input
                      type="number"
                      min="10"
                      value={t.durationSeconds}
                      onChange={(e) => updateTeamField(i, "durationSeconds", e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Package list ── */
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            {localPackages.map((p, i) => (
              <div key={p.id} style={{
                background: "rgba(255,255,255,0.05)",
                border: `2px solid ${p.color}55`,
                borderRadius: 20, padding: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p style={{ color: p.color, fontWeight: 800, fontSize: 15, margin: 0 }}>{p.shortName}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
                      {p.questions.length} câu hỏi
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingPackageIndex(i)}
                    style={{ ...styles.iconBtn, borderColor: `${p.color}55`, color: p.color }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.questions.slice(0, 5).map((q, qi) => (
                    <p key={qi} style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                      {qi + 1}. {q}
                    </p>
                  ))}
                  {p.questions.length > 5 && (
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                      ...và {p.questions.length - 5} câu khác
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const styles = {
  iconBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  label: {
    display: "block",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 0,
  },
};
