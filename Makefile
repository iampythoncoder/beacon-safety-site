.PHONY: dev dev-api dev-web

dev:
	@npm --prefix /Users/saatviksantosh/Documents/New\ project/api run dev & \
	npm --prefix /Users/saatviksantosh/Documents/New\ project/web run dev & \
	wait

dev-api:
	@npm --prefix /Users/saatviksantosh/Documents/New\ project/api run dev

dev-web:
	@npm --prefix /Users/saatviksantosh/Documents/New\ project/web run dev
