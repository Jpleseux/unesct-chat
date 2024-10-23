const express = require('express');
const app = express();
const PORT = 4000; // Define a porta onde o servidor vai rodar
const http = require('http').Server(app); // Cria o servidor HTTP
const cors = require('cors'); // Middleware para permitir requisições de outros domínios
const dotenv = require("dotenv")
dotenv.config()
let users = []; // Lista para armazenar os usuários logados
const socketIO = require('socket.io')(http, {
  cors: {
    origin: process.env.FRONTEND_URL, // Permite conexões via Socket.IO desse endereço
  }
});

// Evento que é disparado quando um novo cliente se conecta ao Socket.IO
socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} Usuario conectado`);

  // Evento para adicionar um novo usuário
  socket.on("new_user", (data) => {
    // Verifica se o usuário já está registrado na lista
    const userExists = users.some(user => user.id === parseInt(data.id));
    if (!userExists) {
      users.push(data); // Adiciona o usuário à lista se ele não existir
      socketIO.emit("receive_users", users); // Emite para todos os usuários a lista atualizada
    }
  });

  // Evento para enviar uma mensagem de um usuário para todos
  socket.on("send_message", (data) => {
    socketIO.emit("response_message", data); // Emite a mensagem para todos os usuários conectados
  });

  // Evento para remover o usuário ao sair
  socket.on("exit", (data) => {
    console.log(data);
    // Filtra a lista de usuários para remover aquele que saiu
    users = users.filter(user => user.id !== parseInt(data.id));
    socketIO.emit("receive_users", users); // Atualiza a lista de usuários para todos
    console.log(users);
  });
});

app.use(cors()); // Permite que o servidor aceite requisições de diferentes origens

// Rota GET para retornar a lista de usuários logados
app.get('/users', (req, res) => {
  res.json({
    message: 'Usuarios logados',
    users: users // Retorna a lista de usuários
  });
});
app.get("/test", (res) => {
  res.json({
    message: "HEllo user"
  })
})
// Rota POST para criar um novo usuário com o nome fornecido na URL
app.post("/new/:name", (req, res) => {
  const userName = req.params.name; // Nome do usuário extraído da URL
  // Verifica se o nome de usuário já existe
  const userExists = users.some(user => user.userName === userName);

  if (userExists) {
    // Retorna erro se o nome já estiver em uso
    return res.status(400).json({
      message: 'Nome de usuário já existe!',
    });
  }

  // Gera um ID aleatório para o novo usuário
  const id = Math.floor(Math.random() * 10000);
  const newUser = { userName, id: id }; // Cria o objeto do novo usuário

  // Responde com o novo usuário criado
  res.status(200).json({
    message: 'Usuário salvo',
    user: newUser,
  });
});

// Inicia o servidor na porta definida
http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
