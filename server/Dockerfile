FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json *.mjs ./
RUN mkdir /app/data && chown node:node /app/data
USER node
ENV BIND_HOST=0.0.0.0 PORT=3000 STATE_FILE=/app/data/timer.json TIMER_TIMEZONE=Asia/Seoul
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "index.mjs"]
