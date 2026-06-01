# Countdown Quiz Arena

Mini game React cho 3 phần thi, có cấu hình thời gian, import danh sách câu hỏi JSON, bỏ qua câu hỏi và tự kết thúc khi hết giờ hoặc khi trả lời đúng toàn bộ câu hỏi.

## Cách chạy

```bash
npm install
npm run dev
```

Sau đó mở link Vite hiển thị trong terminal, thường là `http://localhost:5173`.

## Cách build

```bash
npm run build
npm run preview
```

## Import câu hỏi

Trong giao diện, bấm **Import list câu hỏi JSON** và chọn file JSON theo format:

```json
{
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
}
```

Có sẵn file mẫu tại `src/sample-questions.json`.
