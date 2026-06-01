import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button.jsx";
import { Card, CardContent } from "./components/ui/card.jsx";
import {
  Play,
  RotateCcw,
  SkipForward,
  Check,
  Trophy,
  Upload,
  Clock,
  ListChecks,
  Settings,
} from "lucide-react";

const DEFAULT_CONTESTS = [
  {
    id: "round-1",
    name: "Phần thi 1: Khởi động",
    durationSeconds: 60,
    questions: [
      { text: "Innovation", hint: "A new idea, method, or product" },
      { text: "Collaboration", hint: "Working together to achieve a goal" },
      { text: "Workspace", hint: "A place where people work" },
      { text: "Productivity", hint: "Getting useful work done efficiently" },
    ],
  },
  {
    id: "round-2",
    name: "Phần thi 2: Tăng tốc",
    durationSeconds: 90,
    questions: [
      { text: "Community", hint: "A group of people connected by shared interests" },
      { text: "Focus", hint: "Giving attention to one thing" },
      { text: "Strategy", hint: "A plan to reach a goal" },
      { text: "Feedback", hint: "Comments used to improve something" },
    ],
  },
  {
    id: "round-3",
    name: "Phần thi 3: Về đích",
    durationSeconds: 120,
    questions: [
      { text: "Leadership", hint: "Helping a group move toward a goal" },
      { text: "Creativity", hint: "Using imagination to create something" },
      { text: "Efficiency", hint: "Doing something with less waste" },
      { text: "Customer", hint: "A person who buys or uses a service" },
    ],
  },
];

const DEFAULT_TEAMS = [
  { id: "team-1", name: "Đội 1", durationSeconds: 60, contestIndex: 0 },
  { id: "team-2", name: "Đội 2", durationSeconds: 60, contestIndex: 1 },
  { id: "team-3", name: "Đội 3", durationSeconds: 60, contestIndex: 2 },
];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function normalizeImportedContest(raw, index) {
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map((item) => {
          if (typeof item === "string") return { text: item, hint: "" };
          return {
            text: item.text || item.word || item.question || "",
            hint: item.hint || item.answer || item.description || "",
          };
        })
        .filter((item) => item.text.trim())
    : [];

  return {
    id: raw.id || `imported-round-${index + 1}`,
    name: raw.name || raw.title || `Phần thi ${index + 1}`,
    durationSeconds: Number(raw.durationSeconds || raw.duration || raw.time || 60),
    questions,
  };
}

export default function MiniWordCountdownGame() {
  const fileInputRef = useRef(null);
  const [contests, setContests] = useState(DEFAULT_CONTESTS);
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TEAMS[0].durationSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [importError, setImportError] = useState("");
  const [answeredCorrectIds, setAnsweredCorrectIds] = useState([]);
  const [skippedIds, setSkippedIds] = useState([]);

  const team = teams[selectedTeamIndex];
  const contest = contests[team.contestIndex] || contests[0];
  const questions = contest.questions;
  const currentQuestion = questions[questionIndex];

  const correctCount = answeredCorrectIds.length;
  const skippedCount = skippedIds.length;
  const totalQuestions = questions.length;
  const allAnsweredCorrect = totalQuestions > 0 && correctCount === totalQuestions;
  const progress = useMemo(
    () => Math.max(0, Math.min(100, (timeLeft / team.durationSeconds) * 100)),
    [timeLeft, team.durationSeconds]
  );

  useEffect(() => {
    if (!running || finished) return;

    if (timeLeft <= 0) {
      setFinished(true);
      setRunning(false);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, timeLeft, finished]);

  useEffect(() => {
    if (allAnsweredCorrect && running) {
      setFinished(true);
      setRunning(false);
    }
  }, [allAnsweredCorrect, running]);

  function getQuestionId(index = questionIndex) {
    return `${team.id}-${contest.id}-${index}`;
  }

  function findNextPlayableQuestion(fromIndex = questionIndex) {
    if (questions.length === 0) return 0;

    for (let step = 1; step <= questions.length; step += 1) {
      const nextIndex = (fromIndex + step) % questions.length;
      const nextId = getQuestionId(nextIndex);
      if (!answeredCorrectIds.includes(nextId)) return nextIndex;
    }

    return fromIndex;
  }

  function moveToNextQuestion() {
    setShowHint(false);
    setQuestionIndex(findNextPlayableQuestion(questionIndex));
  }

  function startContest() {
    if (questions.length === 0) {
      setImportError("Phần thi này chưa có câu hỏi.");
      return;
    }

    setImportError("");
    setRunning(true);
    setFinished(false);
  }

  function resetTeam(index = selectedTeamIndex) {
    const nextTeam = teams[index];
    setSelectedTeamIndex(index);
    setQuestionIndex(0);
    setTimeLeft(nextTeam.durationSeconds);
    setRunning(false);
    setFinished(false);
    setShowHint(false);
    setAnsweredCorrectIds([]);
    setSkippedIds([]);
    setImportError("");
  }

  function updateTeamName(value) {
    setTeams((items) =>
      items.map((item, index) => (index === selectedTeamIndex ? { ...item, name: value } : item))
    );
  }

  function updateTeamDuration(value) {
    const seconds = Math.max(10, Number(value || 0));
    setTeams((items) =>
      items.map((item, index) =>
        index === selectedTeamIndex ? { ...item, durationSeconds: seconds } : item
      )
    );
    if (!running) setTimeLeft(seconds);
  }

  function updateTeamContest(value) {
    const contestIndex = Number(value);
    setTeams((items) =>
      items.map((item, index) =>
        index === selectedTeamIndex ? { ...item, contestIndex } : item
      )
    );
    setQuestionIndex(0);
    setRunning(false);
    setFinished(false);
    setShowHint(false);
    setAnsweredCorrectIds([]);
    setSkippedIds([]);
    setImportError("");
  }

  function markCorrect() {
    if (finished || !currentQuestion) return;

    const id = getQuestionId();
    const nextCorrectIds = answeredCorrectIds.includes(id)
      ? answeredCorrectIds
      : [...answeredCorrectIds, id];

    setAnsweredCorrectIds(nextCorrectIds);

    if (nextCorrectIds.length >= totalQuestions) {
      setFinished(true);
      setRunning(false);
      return;
    }

    moveToNextQuestion();
  }

  function skipQuestion() {
    if (finished || !currentQuestion) return;

    const id = getQuestionId();
    if (!skippedIds.includes(id)) setSkippedIds((items) => [...items, id]);
    moveToNextQuestion();
  }

  function importQuestions(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const content = String(loadEvent.target?.result || "");
        const data = JSON.parse(content);
        const rawContests = Array.isArray(data) ? data : data.contests;

        if (!Array.isArray(rawContests)) {
          throw new Error("Invalid format");
        }

        const nextContests = rawContests
          .map(normalizeImportedContest)
          .filter((item) => item.questions.length > 0);

        if (nextContests.length === 0) {
          throw new Error("No questions found");
        }

        setContests(nextContests);
        setTeams((items) =>
          items.map((item) => ({
            ...item,
            contestIndex: Math.min(item.contestIndex, nextContests.length - 1),
          }))
        );
        setSelectedTeamIndex(0);
        setQuestionIndex(0);
        setTimeLeft(teams[0].durationSeconds);
        setRunning(false);
        setFinished(false);
        setAnsweredCorrectIds([]);
        setSkippedIds([]);
        setShowHint(false);
        setImportError("");
      } catch (error) {
        setImportError("Không đọc được file. Hãy dùng file JSON đúng định dạng mẫu.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  const resultMessage = allAnsweredCorrect
    ? "Đã trả lời đúng toàn bộ câu hỏi!"
    : "Đã hết giờ lượt thi.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800 p-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl bg-white/10 p-5 shadow-2xl backdrop-blur lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-pink-200">Mini Game</p>
            <h1 className="mt-1 text-3xl font-black md:text-5xl">Countdown Quiz Arena</h1>
            <p className="mt-2 text-white/75">
              Cấu hình đội thi, thời gian riêng, chọn gói câu hỏi và chỉ kết thúc khi hết giờ hoặc đúng hết.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-xs text-white/60">Time left</p>
              <p className="text-xl font-bold">{formatTime(timeLeft)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-xs text-white/60">Correct</p>
              <p className="text-xl font-bold">{correctCount}/{totalQuestions}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-xs text-white/60">Skipped</p>
              <p className="text-xl font-bold">{skippedCount}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="rounded-[2rem] border-white/20 bg-white/95 shadow-2xl">
            <CardContent className="space-y-5 p-5 text-slate-900">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-700" />
                <h2 className="text-xl font-black">Cấu hình đội thi</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Chọn đội thi</label>
                <div className="grid gap-2">
                  {teams.map((item, index) => {
                    const teamContest = contests[item.contestIndex] || contests[0];
                    return (
                      <button
                        key={item.id}
                        onClick={() => resetTeam(index)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selectedTeamIndex === index
                            ? "border-purple-500 bg-purple-50 text-purple-900"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {teamContest.name} • {teamContest.questions.length} câu hỏi • {formatTime(item.durationSeconds)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Tên đội thi</label>
                <input
                  value={team.name}
                  disabled={running}
                  onChange={(event) => updateTeamName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Gói câu hỏi của đội</label>
                <select
                  value={team.contestIndex}
                  disabled={running}
                  onChange={(event) => updateTeamContest(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-purple-500"
                >
                  {contests.map((item, index) => (
                    <option key={item.id} value={index}>
                      {item.name} ({item.questions.length} câu)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Clock className="h-4 w-4" /> Thời gian của đội, giây
                </label>
                <input
                  type="number"
                  min="10"
                  value={team.durationSeconds}
                  disabled={running}
                  onChange={(event) => updateTeamDuration(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={importQuestions}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="h-12 w-full rounded-2xl"
                >
                  <Upload className="mr-2 h-4 w-4" /> Import list câu hỏi JSON
                </Button>
                {importError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{importError}</p>}
              </div>

              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                <p className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                  <ListChecks className="h-4 w-4" /> Format JSON mẫu
                </p>
                <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed">{`{
  "contests": [
    {
      "name": "Phần thi 1",
      "durationSeconds": 60,
      "questions": [
        { "text": "Câu hỏi 1", "hint": "Gợi ý" },
        { "text": "Câu hỏi 2", "hint": "Gợi ý" }
      ]
    }
  ]
}`}</pre>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-white/20 bg-white/95 shadow-2xl">
            <CardContent className="p-0">
              <div className="h-4 bg-slate-200">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-pink-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="grid gap-6 p-6 text-slate-900 xl:grid-cols-[1fr_280px] xl:p-10">
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-white p-6 text-center shadow-inner">
                  <AnimatePresence mode="wait">
                    {finished ? (
                      <motion.div
                        key="finished"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-5"
                      >
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100">
                          <Trophy className="h-12 w-12 text-yellow-600" />
                        </div>
                        <h2 className="text-4xl font-black">Kết thúc lượt thi!</h2>
                        <p className="text-lg font-semibold text-slate-700">{resultMessage}</p>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-2xl bg-emerald-50 px-5 py-4">
                            <p className="text-xs font-bold text-emerald-700">Đúng</p>
                            <p className="text-2xl font-black text-emerald-800">{correctCount}</p>
                          </div>
                          <div className="rounded-2xl bg-orange-50 px-5 py-4">
                            <p className="text-xs font-bold text-orange-700">Đã bỏ qua</p>
                            <p className="text-2xl font-black text-orange-800">{skippedCount}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-100 px-5 py-4">
                            <p className="text-xs font-bold text-slate-600">Tổng</p>
                            <p className="text-2xl font-black text-slate-800">{totalQuestions}</p>
                          </div>
                        </div>
                        <Button onClick={() => resetTeam()} className="rounded-2xl px-6 py-6 text-base">
                          <RotateCcw className="mr-2 h-5 w-5" /> Chơi lại đội này
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`${team.id}-${contest.id}-${questionIndex}`}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 180, damping: 18 }}
                        className="w-full space-y-6"
                      >
                        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-slate-900 text-4xl font-black text-white shadow-xl md:text-5xl">
                          {formatTime(timeLeft)}
                        </div>

                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
                            {team.name} • {contest.name}
                          </p>
                          <h2 className="mt-3 break-words text-4xl font-black tracking-tight md:text-7xl">
                            {currentQuestion?.text || "Chưa có câu hỏi"}
                          </h2>
                          <p className="mt-3 text-sm font-medium text-slate-500">
                            Câu hiện tại: {Math.min(questionIndex + 1, totalQuestions)}/{totalQuestions}
                          </p>
                        </div>

                        <div className="min-h-12">
                          {currentQuestion?.hint ? (
                            showHint ? (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mx-auto max-w-xl rounded-2xl bg-indigo-50 px-5 py-3 text-lg text-indigo-900"
                              >
                                Gợi ý: {currentQuestion.hint}
                              </motion.p>
                            ) : (
                              <Button variant="outline" onClick={() => setShowHint(true)} className="rounded-2xl">
                                Hiện gợi ý
                              </Button>
                            )
                          ) : (
                            <p className="text-slate-400">Không có gợi ý cho câu này.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-5 text-white">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/50">Điều khiển</p>
                    <div className="mt-5 space-y-3">
                      {!running && !finished ? (
                        <Button onClick={startContest} className="h-14 w-full rounded-2xl text-base font-bold">
                          <Play className="mr-2 h-5 w-5" /> Bắt đầu
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setRunning((value) => !value)}
                          disabled={finished}
                          className="h-14 w-full rounded-2xl text-base font-bold"
                        >
                          {running ? "Tạm dừng" : "Tiếp tục"}
                        </Button>
                      )}

                      <Button
                        onClick={markCorrect}
                        disabled={finished || !currentQuestion}
                        className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold hover:bg-emerald-600"
                      >
                        <Check className="mr-2 h-5 w-5" /> Đúng
                      </Button>

                      <Button
                        onClick={skipQuestion}
                        disabled={finished || !currentQuestion}
                        variant="secondary"
                        className="h-14 w-full rounded-2xl text-base font-bold"
                      >
                        <SkipForward className="mr-2 h-5 w-5" /> Bỏ qua
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/70">
                    <p className="font-semibold text-white">Luật chơi</p>
                    <p className="mt-2">
                      Bấm Đúng để ghi điểm và chuyển câu. Bấm Bỏ qua để chuyển câu nhưng câu đó vẫn có thể quay lại.
                      Mỗi đội có thời gian và gói câu hỏi riêng. Lượt thi chỉ kết thúc khi hết giờ hoặc tất cả câu đã đúng.
                    </p>
                  </div>

                  <Button
                    onClick={() => resetTeam()}
                    variant="outline"
                    className="h-12 rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset đội thi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
