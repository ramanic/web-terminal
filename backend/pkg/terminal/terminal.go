package terminal

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"syscall"
	"unsafe"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

// Message represents the structure of messages sent between client and server
type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

// Terminal represents a terminal session
type Terminal struct {
	cmd    *exec.Cmd
	ptmx   *os.File
	conn   *websocket.Conn
	closed bool
}

func NewTerminal(conn *websocket.Conn) *Terminal {
	return &Terminal{
		conn:   conn,
		closed: false,
	}
}

func (t *Terminal) Start() error {
	// Create a shell command
	shell := "/bin/bash"
	if runtime.GOOS == "windows" {
		shell = "cmd"
	}

	t.cmd = exec.Command(shell)
	
	// Set environment variables
	t.cmd.Env = append(os.Environ(), "TERM=xterm-256color")
	
	// Start the command with a pseudo-terminal
	ptmx, err := pty.Start(t.cmd)
	if err != nil {
		return fmt.Errorf("failed to start pty: %w", err)
	}
	
	t.ptmx = ptmx
	
	// Set initial terminal size
	if err := t.setTerminalSize(80, 24); err != nil {
		log.Printf("Failed to set terminal size: %v", err)
	}
	
	// Start reading from the pseudo-terminal
	go t.readFromPty()
	
	return nil
}

func (t *Terminal) HandleConnection() {
	for {
		if t.closed {
			break
		}
		
		var msg Message
		err := t.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		
		switch msg.Type {
		case "input":
			t.handleInput(msg.Data)
		case "resize":
			t.handleResize(msg.Data)
		case "ping":
			t.sendMessage("pong", "")
		}
	}
}

func (t *Terminal) handleInput(data string) {
	if t.ptmx != nil && !t.closed {
		_, err := t.ptmx.Write([]byte(data))
		if err != nil {
			log.Printf("Failed to write to pty: %v", err)
		}
	}
}

func (t *Terminal) handleResize(data string) {
	var size struct {
		Cols int `json:"cols"`
		Rows int `json:"rows"`
	}
	
	if err := json.Unmarshal([]byte(data), &size); err != nil {
		log.Printf("Failed to parse resize data: %v", err)
		return
	}
	
	if err := t.setTerminalSize(size.Cols, size.Rows); err != nil {
		log.Printf("Failed to resize terminal: %v", err)
	}
}

func (t *Terminal) setTerminalSize(cols, rows int) error {
	if t.ptmx == nil {
		return fmt.Errorf("terminal not initialized")
	}
	
	// Set terminal size using syscall
	if runtime.GOOS != "windows" {
		ws := &struct {
			Row    uint16
			Col    uint16
			Xpixel uint16
			Ypixel uint16
		}{
			Row: uint16(rows),
			Col: uint16(cols),
		}
		
		_, _, errno := syscall.Syscall(
			syscall.SYS_IOCTL,
			uintptr(t.ptmx.Fd()),
			uintptr(syscall.TIOCSWINSZ),
			uintptr(unsafe.Pointer(ws)),
		)
		
		if errno != 0 {
			return fmt.Errorf("failed to set terminal size: %v", errno)
		}
	}
	
	return nil
}

func (t *Terminal) readFromPty() {
	buffer := make([]byte, 1024)
	for {
		if t.closed {
			break
		}
		
		n, err := t.ptmx.Read(buffer)
		if err != nil {
			if err == io.EOF {
				break
			}
			log.Printf("Failed to read from pty: %v", err)
			break
		}
		
		if n > 0 {
			t.sendMessage("output", string(buffer[:n]))
		}
	}
}

func (t *Terminal) sendMessage(msgType, data string) {
	if t.closed {
		return
	}
	
	msg := Message{
		Type: msgType,
		Data: data,
	}
	
	if err := t.conn.WriteJSON(msg); err != nil {
		log.Printf("Failed to send message: %v", err)
		t.Close()
	}
}

func (t *Terminal) Close() {
	if t.closed {
		return
	}
	
	t.closed = true
	
	if t.ptmx != nil {
		t.ptmx.Close()
	}
	
	if t.cmd != nil && t.cmd.Process != nil {
		t.cmd.Process.Kill()
	}
}
