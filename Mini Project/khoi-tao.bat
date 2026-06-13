@echo off
echo ==========================================
echo DANG KHOI TAO DU AN TASKAI...
echo ==========================================

echo [1/3] Cai dat thu vien cho Backend...
cd backend
call npm.cmd install
if %errorlevel% neq 0 (
    echo Xay ra loi khi cai dat backend.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Khoi tao co so du lieu SQLite...
call npx.cmd prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo Xay ra loi khi migrate database.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Cai dat thu vien cho Frontend...
cd ../frontend
call npm.cmd install
if %errorlevel% neq 0 (
    echo Xay ra loi khi cai dat frontend.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo KHOI TAO THANH CONG!
echo Ban co the chay "chay-backend.bat" va "chay-frontend.bat" de bat dau.
echo ==========================================
pause
