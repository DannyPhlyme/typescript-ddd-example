import container from './config/dependency-injection';
import errorHandler from 'errorhandler';
import helmet from 'helmet';
import compress from 'compression';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import flash from 'connect-flash';
import express from 'express';
import * as http from 'http';
import Logger from '../../../Contexts/Shared/domain/Logger';
import { registerRoutes } from './routes';
import cookieSession from 'cookie-session';
import nunjucks from 'nunjucks';
import path from 'path';

export class Server {
  private express: express.Express;
  private port: string;
  private logger: Logger;
  private httpServer?: http.Server;

  constructor(port: string) {
    this.port = port;
    this.logger = container.get('Shared.Logger');
    this.express = express();
    this.express.use(cookieParser());
    this.express.use(
      cookieSession({
        name: 'Backoffice Frontend Codely session',
        keys: ['Codely'],
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      })
    );
    this.express.use(flash());
    // Templates
    this.express.set('view engine', 'html');
    nunjucks.configure(path.join(__dirname, '/templates'), {
      autoescape: true,
      express: this.express,
      watch: true
    });
    this.express.use(express.static(path.join(__dirname, '/public')));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(helmet.xssFilter());
    this.express.use(helmet.noSniff());
    this.express.use(helmet.hidePoweredBy());
    this.express.use(helmet.frameguard({ action: 'deny' }));
    this.express.use(compress());
    registerRoutes(this.express);
    this.express.use(errorHandler());
  }

  async listen(): Promise<void> {
    return new Promise(resolve => {
      this.httpServer = this.express.listen(this.port, () => {
        this.logger.info(`  App is running at http://localhost:${this.port} in ${this.express.get('env')} mode`);
        this.logger.info('  Press CTRL-C to stop\n');
        resolve();
      });
    });
  }

  stop() {
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}
