FROM node:22-alpine

WORKDIR /app

# Copia os arquivos de pacotes primeiro para otimizar o cache do Docker
COPY package.json package-lock.json* ./

# Instala as dependências do projeto
RUN npm install

# Copia o resto do código da sua máquina para dentro do Docker
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Comando padrão
CMD ["npm", "run", "dev"]