# 🎧 Ambience

> Seu espaço virtual definitivo para foco, relaxamento e produtividade.

**Ambience** é uma aplicação web minimalista projetada para ajudar você a entrar em estado de *flow*. Combinando um mixer de sons da natureza, streaming de lo-fi temático, um timer Pomodoro e ferramentas essenciais de produtividade, ele oferece tudo o que você precisa para estudar, trabalhar ou programar sem distrações.

---

## ✨ Funcionalidades

* **🎵 Lo-fi Player Inteligente:** Streaming de trilhas sonoras temáticas (Zelda, Ghibli, etc.) sob demanda. O player é otimizado para não gargalar a rede, gerenciando conexões ativas automaticamente.
* **🌧️ Mixer de Ambientes:** Crie sua própria atmosfera misturando sons da natureza (Chuva, Floresta, Fogueira, etc.). Utiliza a **Web Audio API** para transições de volume suaves e mixagem em tempo real.
* **⏱️ Pomodoro Timer Integrado:** Ciclos de Foco e Pausa customizáveis com alertas sonoros sutis e rastreador de ciclos concluídos.
* **📝 Produtividade Local:** Bloco de notas livre e To-Do List interativa. Tudo é salvo automaticamente no seu navegador via `localStorage`.
* **🎨 Motor de Temas:** Personalize o visual do app de acordo com seu humor. Inclui Modo Dark, paletas em tons pastéis e fundos fotográficos imersivos.
* **🧘 Modo Zen:** Oculte elementos de interface desnecessários com um clique (ou tecla ESC) para imersão total.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com foco em performance e simplicidade, sem a necessidade de frameworks pesados:

* **HTML5 & CSS3:** Estrutura semântica e estilização moderna (CSS Variables, Flexbox/Grid).
* **JavaScript (Vanilla):** Lógica da aplicação.
* **Web Audio API:** Manipulação avançada de áudio, controle de `GainNodes` e geração de frequências (beeps do timer).
* **LocalStorage:** Persistência de dados do usuário (notas, tarefas, configurações e tema escolhido).

