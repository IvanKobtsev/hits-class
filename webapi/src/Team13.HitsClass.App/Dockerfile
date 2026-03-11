FROM mcr.microsoft.com/dotnet/aspnet:10.0
USER root

RUN \
  apt-get update \
  && apt-get -y install gettext-base curl \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get -y install nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir /files \
  && chmod 777 /files

ENV ASPNETCORE_URLS="http://*:5000"
COPY . /webapi

RUN useradd dotnetuser --create-home --uid 4000 && \
  chown dotnetuser /webapi && \
  chown -R dotnetuser /webapi/wwwroot

WORKDIR /webapi
USER dotnetuser
ENTRYPOINT node ./import-meta-env/bin/import-meta-env.js -x ./wwwroot/.env -e ./wwwroot/.env -p ./wwwroot/* && dotnet Team13.HitsClass.App.dll
EXPOSE 5000
