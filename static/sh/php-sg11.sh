#!/bin/bash
cachedir=$1
phpextenddir=$2
phpv=$3
arch=$4
password=$5
cd "$cachedir" || exit 1
curl -C - -O -L -s https://www.sourceguardian.com/loaders/download/loaders.macosx"$arch".tar.gz
if [ ! -f "loaders.macosx$arch.tar.gz" ]; then
  exit 1
fi
if [ -d "loaders.macosx$arch" ]; then
 rm -rf "loaders.macosx$arch"
fi
mkdir "loaders.macosx$arch"
cd "loaders.macosx$arch" || exit 1
tar -zxf "$cachedir"/loaders.macosx"$arch".tar.gz
if [ -f "ixed.$phpv.dar" ]; then
  if [ ! -d "$phpextenddir" ]; then
   echo "$password" | sudo -S mkdir -p "$phpextenddir"
  fi
  echo "$password" | sudo -S cp -rf ixed."$phpv".dar "$phpextenddir"/ixed.dar
else
  exit 1
fi
