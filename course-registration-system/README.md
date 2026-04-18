# IUH-EduHub / IUH-EduHub

IUH-EduHub là hệ thống quản lý đăng ký học phần cho trường đại học, gồm backend REST API với Express/MongoDB và frontend Next.js App Router. Hệ thống hỗ trợ xác thực JWT, phân quyền theo vai trò, quản lý học kỳ, môn học, giảng viên, sinh viên, đăng ký học phần và thông báo.

## Sinh viên thực hiện / Students

- Phan Nhật Bản - 22682001
- Huỳnh Vinh Phát - 22702261

## Tính năng chính / Key Features

- Đăng nhập, xác thực JWT và phân quyền `admin`, `teacher`, `student`. / Login, JWT authentication, and role-based access for `admin`, `teacher`, and `student`.
- Quản lý sinh viên, giảng viên, môn học và học kỳ. / Manage students, teachers, courses, and semesters.
- Đăng ký và hủy đăng ký học phần. / Register for and cancel course registrations.
- Dashboard thống kê cho admin. / Admin dashboard with statistics.
- Hệ thống thông báo và đánh dấu đã đọc. / Notification system with read tracking.
- Tìm kiếm, báo cáo và xuất CSV. / Search, reports, and CSV export.
- Giao diện tiếng Việt, hỗ trợ theme sáng/tối. / Vietnamese UI with light and dark theme support.

## Công nghệ sử dụng / Tech Stack

| Thành phần / Component | Công nghệ / Technology |
| --- | --- |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, CORS, dotenv |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, next-themes, shadcn/ui, lucide-react, Recharts |
| Tooling | ESLint, Turbopack, Nodemon |

## Cấu trúc dự án / Project Structure

```text
course-registration-system/
├── backend/   # API, models, controllers, middleware, seed data / API, models, controllers, middleware, seed data
├── frontend/  # Next.js app, components, lib, UI shell / Ứng dụng Next.js, components, lib, shell giao diện
└── README.md  # Tài liệu gốc của toàn bộ dự án / Root documentation for the whole project
```

## Yêu cầu trước khi chạy / Prerequisites

- Node.js LTS.
- MongoDB đang chạy cục bộ hoặc trên cloud. / MongoDB running locally or in the cloud.
- Cài dependencies riêng cho `backend/` và `frontend/`. / Install dependencies separately in `backend/` and `frontend/`.

## Biến môi trường / Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/course_registration
JWT_SECRET=your_super_secret_key
```

Ghi chú / Notes:

- Nếu không khai báo `PORT`, backend mặc định dùng `5000`. / If `PORT` is not set, the backend defaults to `5000`.
- `MONGODB_URI` có thể thay bằng `MONGO_URI`; nếu không có, app sẽ dùng database local mặc định. / `MONGODB_URI` can be replaced with `MONGO_URI`; if neither is set, the app uses the local default database.
- `JWT_SECRET` nên đặt riêng cho môi trường production. / `JWT_SECRET` should be custom for production.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Cài đặt và chạy / Installation and Run

### 1. Backend / Backend

```bash
cd backend
npm install
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`. / The backend will run at `http://localhost:5000`.

### 2. Frontend / Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000` và mặc định chuyển từ `/` sang `/login`. / The frontend will run at `http://localhost:3000` and redirect from `/` to `/login`.

### 3. Chạy production / Production

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run start
```

## Tài khoản demo / Demo Accounts

Sau khi nạp dữ liệu mẫu, có thể dùng các tài khoản sau. / After seeding demo data, use these accounts:

- Admin: `Admin@iuh.edu.vn` / `AD001`
- Giảng viên / Teachers: `gv001@iuh.edu.vn` đến `gv078@iuh.edu.vn`, mật khẩu trùng với mã `GV001`...`GV078`. / Password matches the ID code.
- Sinh viên / Students: `sv001@iuh.edu.vn` đến `sv010@iuh.edu.vn`, mật khẩu trùng với mã `SV001`...`SV010`. / Password matches the ID code.
- Các `userId` được tạo theo thứ tự: `AD001`, `GV001`... `GV078`, `SV001`... `SV010`.

## Cách test website / How to test

1. Chạy seed lại cơ sở dữ liệu bằng `cd backend && node seed/seedData.js`. / Reseed the database with `cd backend && node seed/seedData.js`.
2. Mở backend bằng `cd backend && npm run dev`. / Start the backend with `cd backend && npm run dev`.
3. Mở frontend bằng `cd frontend && npm run dev` hoặc `bun run dev` nếu môi trường Bun đã sẵn sàng. / Start the frontend with `cd frontend && npm run dev` or `bun run dev` if Bun is available.
4. Đăng nhập sinh viên bằng `sv001@iuh.edu.vn` / `SV001`, mở trang `Đăng ký học phần`, chọn một môn đang mở trong học kỳ hiện tại và bấm `Đăng ký`. Sau đó kiểm tra mục `Môn đã đăng ký` và `Khóa học` để thấy số sĩ số thay đổi.
5. Đăng nhập giảng viên bằng `gv001@iuh.edu.vn` / `GV001`, mở trang `Đăng ký học phần`, chọn lớp của mình trong phần `Xem sinh viên theo lớp` để xem số lượng sinh viên và danh sách sinh viên đã đăng ký. Các thao tác thêm/sửa/xóa vẫn thuộc admin.
6. Đăng nhập admin bằng `Admin@iuh.edu.vn` / `AD001`, kiểm tra `Dashboard`, `Students`, `Teachers`, `Courses`, `Đăng ký học phần` và `Reports`. Admin có thể xem toàn bộ danh sách đăng ký và lịch sử.

## Seed dữ liệu mẫu / Seed Data

File seed nằm ở [backend/seed/seedData.js](backend/seed/seedData.js). Script này xóa sạch dữ liệu hiện có trước khi tạo lại dữ liệu demo, nên chỉ nên chạy khi bạn chấp nhận reset database.

The seed file is located at [backend/seed/seedData.js](backend/seed/seedData.js). It deletes existing data before recreating demo records, so only run it when you are okay with resetting the database.

Sau khi seed, các collection chính dùng mã chuỗi theo thứ tự như `AD001`, `GV001`, `SV001`, `HK001`, `MH001`, `DK001`, `TB001` thay cho `ObjectId` mặc định. / After seeding, the main collections use ordered string IDs such as `AD001`, `GV001`, `SV001`, `HK001`, `MH001`, `DK001`, `TB001` instead of the default `ObjectId` values.

Chạy thủ công / Run manually:

```bash
cd backend
node seed/seedData.js
```

## API backend / Backend API

Tất cả API đều có tiền tố `/api`. / All endpoints are prefixed with `/api`.

### Auth / Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users / Người dùng

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Teachers / Giảng viên

- `GET /api/teachers`
- `GET /api/teachers/:id`
- `POST /api/teachers`
- `PUT /api/teachers/:id`
- `DELETE /api/teachers/:id`

### Semesters / Học kỳ

- `GET /api/semesters`
- `GET /api/semesters/active`
- `GET /api/semesters/:id`
- `POST /api/semesters`
- `PUT /api/semesters/:id`
- `DELETE /api/semesters/:id`

### Courses / Môn học

- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`

### Registrations / Đăng ký học phần

- `POST /api/registrations`
- `DELETE /api/registrations/:id`
- `GET /api/registrations`

### Notifications / Thông báo

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `POST /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### Dashboard / Bảng điều khiển

- `GET /api/dashboard`

## Frontend routes / Frontend Routes

- `/login`: đăng nhập / login.
- `/dashboard`: thống kê và biểu đồ / statistics and charts.
- `/students`: quản lý sinh viên / student management.
- `/teachers`: quản lý giảng viên / teacher management.
- `/courses`: quản lý môn học / course management.
- `/registration`: danh sách đăng ký / registration records.
- `/search`: tìm kiếm / search.
- `/reports`: báo cáo / reports.
- `/`: chuyển hướng sang `/login` / redirects to `/login`.

Các trang sau khi đăng nhập nằm dưới `frontend/app/(app)/`, còn trang đăng nhập công khai nằm dưới `frontend/app/(auth)/login/`. / Protected pages live under `frontend/app/(app)/`, while the public login page lives under `frontend/app/(auth)/login/`.

## Ghi chú quan trọng / Important Notes

- Frontend lưu JWT trong `localStorage`. / The frontend stores JWT in `localStorage`.
- CORS đang bật ở backend. / CORS is enabled on the backend.
- Nếu frontend không gọi được API, hãy kiểm tra `NEXT_PUBLIC_API_BASE_URL`. / If the frontend cannot reach the API, check `NEXT_PUBLIC_API_BASE_URL`.
- Nếu backend báo lỗi kết nối, hãy kiểm tra `MONGODB_URI` và trạng thái MongoDB. / If the backend reports a connection error, check `MONGODB_URI` and the MongoDB service.
- Dự án cần chạy backend và frontend trong hai thư mục riêng. / Run the backend and frontend in their own folders.

## Tài liệu liên quan / Related Docs

- [Frontend README](frontend/README.md)
- [Backend package.json](backend/package.json)
- [Frontend package.json](frontend/package.json)
