# Script injection

<img width="648" alt="image" src="https://user-images.githubusercontent.com/1120896/169384297-79bf6cb5-b0e5-4476-8b66-fce1fc87c765.png">

Scripts injected by WebPageTest onto each page.

## ⚠️ Warning

Do not do complex operations in injected scripts!

We don't want to influence the results of the pages we're testing, for example inflate the Total Blocking Time (TBT) because of slow-running injected scripts.
