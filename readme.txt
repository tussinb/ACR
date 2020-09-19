we use SimpleHTTP to run small local server on port 80

the module is from https://www.nuget.org/packages/Simple-HTTP

This might cause error if not run command below

run this command as administrator

netsh urlacl url=http://+:80/ user="Everyone"

you can type netsh on run and right click and run as administrator then
paste 
urlacl url=http://+:80/ user="Everyone"
then [ENTER]

