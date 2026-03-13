create the core types for the task marketplace. theres 3 task types per the PRD:

1. Form Submission - has target url and instructions
2. Email Sending - has email content template and recipient count  
3. Social Media Liking - has post url, platform (twitter/linkedin/instagram), engagement type

use discriminated unions so typescript actually helps us. each task type should have its own specific fields plus shared fields like id, title, description, reward, status, etc

also create Submission type for when workers submit completed work

for the store just use a simple module with getter/setter functions. no redux or zustand, the app isnt complex enough to need it. generate like 15-20 realistic tasks and 100+ submissions so we can test the virtualization later
