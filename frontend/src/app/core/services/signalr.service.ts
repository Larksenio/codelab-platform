import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection: signalR.HubConnection | null = null;

  async connectAsync(token?: string | null): Promise<signalR.HubConnection> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.connection) {
      await this.connection.start();
      return this.connection;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/exercise`, token
        ? { accessTokenFactory: () => token }
        : {})
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    await this.connection.start();
    return this.connection;
  }

  disconnect(): void {
    this.connection?.stop();
    this.connection = null;
  }
}
