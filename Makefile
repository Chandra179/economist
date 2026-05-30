.PHONY: build build-server build-ui run-server run-ui lint-server lint-ui lint clean

build: build-server build-ui

build-server:
	cd server && go build -o economist-server .

build-ui:
	cd ui && npm run build

run-server:
	mkdir -p server/data && cd server && ./economist-server

run-ui:
	cd ui && npm run dev

lint-server:
	cd server && go vet ./...

lint-ui:
	cd ui && npm run lint

lint: lint-server lint-ui

clean:
	rm -f server/economist-server
	rm -rf server/data/
	rm -rf ui/dist/
