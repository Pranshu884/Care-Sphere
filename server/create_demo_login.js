import fs from 'fs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'careSphereJwtSecret987654321secure';
const mockUserId = '112233445566778899aabbcc';

const token = jwt.sign(
  {
    sub: mockUserId,
    email: 'test@example.com',
    name: 'Test User'
  },
  JWT_SECRET,
  { expiresIn: '10h' }
);

const user = { id: mockUserId, name: 'Test User', email: 'test@example.com' };

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Auto Login</title>
</head>
<body>
  <p>Logging in...</p>
  <script>
    localStorage.setItem('caresphere_token', '${token}');
    localStorage.setItem('caresphere_user', JSON.stringify(${JSON.stringify(user)}));
    window.location.href = '/health-reports';
  </script>
</body>
</html>
`;

if (!fs.existsSync('../public')) {
  fs.mkdirSync('../public');
}
fs.writeFileSync('../public/demo-login.html', html);
console.log('Created demo-login.html');
