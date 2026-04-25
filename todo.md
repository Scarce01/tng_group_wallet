todo 

security feature 
解决的问题是 如果只是用 pin 
密码 sms 泄露 就问题大了 

so 
1. device bind approval 
under login
我不需要 6 digit pin
我要的是只有 phone number 
然后一个 button for verify
会弹到 tng but now is mock_approval/ for approval 
TNG 端对 challenge 做签名或确认
你们 backend 验证 challenge 没被改、没过期、没重放
才发 session 给你们 app

不要让批准只是一个模糊的“yes”。
批准内容要明确绑定：
哪个 phone number
哪台 device
哪个 app
哪个 login request
有效多久

我的 backend approval 应该在 aws cloud 上面 
账号密码 是 
可以用 aws cli to configure for it 
https://d-9667a99701.awsapps.com/start/#/
Account E-mail : talenttap+finhackuser80@tngdigital.com.my
Password : ga!Nh8E5Ldg;AkYX$W}*

Lambda 做 checking 是好的
前提是你把它用在：
auth / approval verification
replay / nonce / expiry checking
risk / alert / logging

2. pool invitation 
