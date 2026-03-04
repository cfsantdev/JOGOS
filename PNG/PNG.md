<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GENGINE - Game Engine</title>
    
    <link rel="icon" type="image/png" href="gengine.png">

    <style>
        /* Estilos Globais e Reset */
        :root {
            --bg-color: #1a1a1a;
            --text-color: #e0e0e0;
            --accent-color: #00ffff; /* Ciano Elétrico do logo */
            --secondary-accent: #32CD32; /* Verde Lima do logo */
            --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-family);
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden; /* Impede barras de rolagem na splash screen */
        }

        /* Container Principal Centralizado */
        .splash-container {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            animation: fadeIn 1.5s ease-in-out;
        }

        /* Estilo do Ícone Gerado */
        .gengine-icon {
            width: 150px; /* Tamanho visível central */
            height: 150px;
            object-fit: contain;
            border-radius: 20px; /* Opcional: cantos arredondados */
            box-shadow: 0 10px 30px rgba(0, 255, 255, 0.2); /* Sombra suave ciano */
        }

        /* Estilo do Texto GENGINE */
        .gengine-title {
            font-size: 3rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin: 0;
            color: var(--text-color);
            text-shadow: 0 2px 10px rgba(0, 255, 255, 0.5); /* Brilho ciano */
        }

        /* Detalhe sutil abaixo do texto */
        .gengine-subtitle {
            font-size: 1rem;
            color: var(--secondary-accent);
            opacity: 0.8;
            letter-spacing: 0.05em;
        }

        /* Animação de Entrada */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>

    <div class="splash-container">
        <img src="gengine.png" alt="GENGINE Logo" class="gengine-icon">
        
        <h1 class="gengine-title">GENGINE</h1>
        
        <p class="gengine-subtitle">Seu Framework JavaScript para Jogos</p>
    </div>

</body>
</html>
