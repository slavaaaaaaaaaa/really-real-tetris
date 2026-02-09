host:=

deploy:
	jekyll b
	rsync -vr --no-perms --delete-after --delete-excluded _site/ ${host}:~/site/
	ssh ${host} 'sudo rm -r blog; mv site blog; sudo chown -R nginx:nginx blog; sudo service nginx reload'

test:
	bundle exec jekyll serve
