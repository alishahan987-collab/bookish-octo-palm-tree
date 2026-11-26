STYLE="cartoon comic strip panel, bold black outlines, flat colors, simple shapes, vector illustration, warm muted colors, nobody, no people, no text"
i=0
while IFS='|' read -r n p; do
  i=$((i+1))
  for try in 1 2 3 4 5 6 7 8; do
    q=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$p, $STYLE")
    code=$(curl -s -m 150 -o backgrounds/raw_$n.jpg -w "%{http_code}" "https://image.pollinations.ai/prompt/$q?width=1280&height=720&nologo=true&enhance=true&seed=$((i*17+try))")
    if [ "$code" = 200 ] && file backgrounds/raw_$n.jpg | grep -q JPEG; then echo "$n ok"; python3 tools/toonify.py backgrounds/raw_$n.jpg backgrounds/$n.jpg; break; fi
    echo "$n fail $code"; sleep 8
  done
done < backgrounds.txt
echo ALLDONE
