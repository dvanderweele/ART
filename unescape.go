package main

import(
  "html"
  "os"
  "bufio"
)

func main(){
  f := bufio.NewWriter(os.Stdout)
  defer f.Flush()
  f.Write([]byte(html.UnescapeString(os.Args[1])))
}
