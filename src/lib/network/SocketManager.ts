export interface SocketListener {
  onMessage: (type: string, payload: any) => void;
  onStatusChange: (connected: boolean) => void;
}

export class SocketManager {
  private socket: WebSocket | null = null;
  private listeners = new Set<SocketListener>();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string = "";
  private userDetails: { id: string; username: string; rating: number } | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseDelay = 1000; // 1 second

  connect(url: string, id: string, username: string, rating: number) {
    this.url = url;
    this.userDetails = { id, username, rating };
    this.reconnectAttempts = 0;
    this._establishConnection();
  }

  private _establishConnection() {
    if (this.socket) {
      this.disconnect();
    }

    try {
      const ws = new WebSocket(this.url);
      this.socket = ws;

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.listeners.forEach((l) => {
          try {
            l.onStatusChange(true);
          } catch (err) {
            console.error("Error in status change callback:", err);
          }
        });

        // Register user details with server immediately upon connection
        if (this.userDetails) {
          this.send("join_session", this.userDetails);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;
          this.listeners.forEach((l) => {
            try {
              l.onMessage(type, payload);
            } catch (err) {
              console.error("Error in onMessage callback:", err);
            }
          });
        } catch (e) {
          console.error("Failed to parse websocket message:", e);
        }
      };

      ws.onclose = () => {
        this.socket = null;
        this.listeners.forEach((l) => {
          try {
            l.onStatusChange(false);
          } catch (err) {
            console.error("Error in status change callback:", err);
          }
        });
        this._handleReconnect();
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    } catch (e) {
      console.error("Failed to establish WebSocket connection:", e);
      this._handleReconnect();
    }
  }

  private _handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max reconnect attempts reached. Giving up reconnecting.");
      return;
    }

    if (this.reconnectTimeout) return;

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this._establishConnection();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnect on intentional disconnect
      this.socket.close();
      this.socket = null;
    }
    this.listeners.forEach((l) => {
      try {
        l.onStatusChange(false);
      } catch (err) {
        console.error("Error in status change callback:", err);
      }
    });
  }

  send(type: string, payload: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }

  subscribe(listener: SocketListener) {
    this.listeners.add(listener);
    // Sync current status to the subscriber
    listener.onStatusChange(this.isConnected());
    return () => {
      this.listeners.delete(listener);
    };
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export const globalSocketManager = new SocketManager();
