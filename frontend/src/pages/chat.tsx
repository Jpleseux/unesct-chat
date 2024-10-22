import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";

function Chat() {
  const timerRef = useRef<NodeJS.Timeout | null>(null); // Armazena um timer para gerenciar o timeout
  const [user, setUser] = useState<string>(""); // Nome do usuário
  const [users, setUsers] = useState<{ userName: string; socketID: string }[]>([]); // Lista de usuários conectados
  const [message, setMessage] = useState<string>(""); // Mensagem atual sendo digitada
  const [socket, setSocket] = useState<Socket | null>(null); // Instância do socket
  const [messages, setMessages] = useState<{ userName: string; text: string }[]>([]); // Lista de mensagens
  const navigate = useNavigate(); // Navegação entre rotas

  // Função para buscar os usuários do servidor
  async function getUsers() {
    try {
      const response = await fetch(import.meta.env.VITE_SERVER_URL + '/users');
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }
      const data = await response.json();
      setUsers(data.users); // Atualiza a lista de usuários
    } catch (error) {
      console.error('Erro:', error);
    }
  }

  // Função para enviar mensagem
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      const data = { text: message, userName: user }; // Cria o objeto da mensagem
      socket?.emit("send_message", data); // Envia a mensagem pelo socket
      setMessage(""); // Limpa o campo de mensagem
    }
  };

  // Função para remover o usuário ao sair do chat
  const exitUser = () => {
    if (socket) {
      socket.emit("exit", { userName: user, id: localStorage.getItem("id") }); // Emite o evento de saída
    }
    localStorage.removeItem("userName"); // Remove o nome do usuário do localStorage
    localStorage.removeItem("id"); // Remove o ID do localStorage
    setTimeout(() => {
      navigate("/"); // Redireciona para a página inicial
    }, 400); // Aguarda um tempo antes de redirecionar
  };

  // useEffect que roda ao carregar a página
  useEffect(() => {
    // Se o usuário não tem ID, redireciona para a tela de login
    if (!localStorage.getItem("id")) {
      navigate("/");
    }

    getUsers(); // Busca os usuários
    setUser(localStorage.getItem("userName") || ""); // Define o nome do usuário

    // Conecta ao servidor com Socket.IO
    const newSocket: Socket = io(import.meta.env.VITE_SERVER_URL);
    setSocket(newSocket);

    // Emite um evento informando que um novo usuário entrou
    newSocket.emit("newUser", { userName: localStorage.getItem("userName"), id: localStorage.getItem("id") });

    return () => {
      newSocket.disconnect(); // Desconecta ao desmontar o componente
    };
  }, [navigate]);

  // useEffect para lidar com eventos de mensagens e lista de usuários
  useEffect(() => {
    if (!socket) return;

    // Recebe lista de usuários do servidor
    socket.on("receive_users", (data) => {
      setUsers(data);
    });

    // Recebe mensagens do servidor
    socket.on("response_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]); // Atualiza a lista de mensagens
    });

    return () => {
      socket.off("receive_users"); // Remove o listener de usuários
      socket.off("response_message"); // Remove o listener de mensagens
    };
  }, [socket]);

  // useEffect para gerenciar a saída do usuário ao fechar a aba ou ficar inativo
  useEffect(() => {
    // Função que executa ao fechar ou recarregar a aba
    const handleTabClose = (event) => {
      exitUser(); // Remove o usuário
      event.returnValue = ''; // Exibe alerta padrão
    };

    // Função para gerenciar quando o usuário sai ou retorna à aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Se a aba foi escondida, inicia um timer para sair após 5 minutos
        timerRef.current = setTimeout(() => {
          exitUser();
        }, 300000); // 5 minutos
      } else if (document.visibilityState === 'visible') {
        // Se a aba foi reexibida, cancela o timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          console.log("Usuário voltou para a aba. Timer cancelado.");
        }
      }
    };

    // Adiciona eventos de visibilidade e fechamento de aba
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleTabClose);

    // Remove os eventos ao desmontar o componente
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleTabClose);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [socket]);

  // Renderização do chat
  return (
    <div className="chat">
      {/* Barra lateral com a lista de usuários */}
      <div className="chat__sidebar">
        <h2 className="chat__header">Usuários Logados</h2>
        <div className="chat__users">
          {users.map((loggedUser, index) => (
            <p key={index} className="online__users">
              {loggedUser.userName}
            </p>
          ))}
        </div>
      </div>

      {/* Área principal do chat */}
      <div className="chat__main">
        <div className="chat__mainHeader">
          <h2>Bem-vindo, {user}</h2>
          <button className="leaveChat__btn" onClick={exitUser}>Sair do Chat</button>
        </div>

        <div className="message__container">
          <div className="message__chats">
            {messages.map((msg, index) => (
              <div key={index} className={msg.userName === user ? "message__sender" : "message__recipient"}>
                <b>{msg.userName}:</b> {msg.text}
              </div>
            ))}
          </div>
        </div>

        {/* Formulário para enviar mensagens */}
        <div className="chat__footer">
          <form className="form" onSubmit={handleSendMessage}>
            <input
              className="message"
              type="text"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="sendBtn" type="submit">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
