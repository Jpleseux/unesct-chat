import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from "socket.io-client";

function Home() {
  const navigate = useNavigate(); // Utilizado para redirecionar o usuário para outra página
  const [userName, setUserName] = useState<string>(''); // Armazena o nome de usuário digitado
  const [socket, setSocket] = useState<Socket | null>(null); // Instância do socket

  // Função que será chamada ao submeter o formulário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evita o comportamento padrão do formulário
    // Faz uma requisição para criar um novo usuário com o nome fornecido
    const response = await fetch(import.meta.env.VITE_SERVER_URL + `/new/${userName}`, {
      method: "POST", // Método POST para enviar dados ao servidor
      headers: {
        "Content-Type": "application/json", // Define o tipo de conteúdo da requisição
      },
    });

    const data = await response.json(); // Transforma a resposta em JSON

    // Se a requisição foi bem-sucedida
    if (response.ok) {
      // Armazena o nome e o ID do usuário no localStorage para usá-los posteriormente
      localStorage.setItem('userName', userName);
      localStorage.setItem('id', data.user.id);

      // Se o socket estiver conectado, emite um evento para notificar que um novo usuário foi criado
      if (socket) {
        socket.emit("new_user", { userName: userName, id: data.user.id });
      }
      navigate('/chat'); // Redireciona para a página do chat
    } else {
      // Exibe uma mensagem de erro caso a criação do usuário falhe
      window.alert(data.message || 'Erro ao criar o usuário');
    }
  };

  // useEffect que roda ao carregar a página
  useEffect(() => {
    // Se o usuário já estiver logado (com ID), redireciona para o chat
    if (localStorage.getItem("id")) {
      navigate("/chat");
    }

    // Cria uma nova conexão com o servidor via Socket.IO
    const newSocket: Socket = io(import.meta.env.VITE_SERVER_URL);
    setSocket(newSocket); // Armazena o socket

    // Desconecta o socket ao desmontar o componente
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [navigate]);

  return (
    <form className="home__container" onSubmit={handleSubmit}>
      <h2 className="home__header">Coloque um nickname legal para entrar no chat</h2>
      {/* Campo de entrada do nome de usuário */}
      <input
        type="text"
        name="username"
        id="username"
        className="username__input"
        value={userName}
        onChange={(e) => setUserName(e.target.value)} // Atualiza o nome de usuário conforme o usuário digita
        required // Campo obrigatório
      />
      <button className="home__cta">Entrar</button>
    </form>
  );
}

export default Home;
