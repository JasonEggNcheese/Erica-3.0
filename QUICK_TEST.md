# Quick Functionality Test Checklist

## Pre-Test Setup
- [ ] Set API_KEY environment variable: `export API_KEY="your-gemini-api-key"`
- [ ] Run: `npm start`
- [ ] Open browser to: `http://localhost:8080`
- [ ] Grant camera and microphone permissions when prompted

---

## Tab 1: Interactive Mode
### Camera Feed
- [ ] Click "Start Interactive Session"
- [ ] Verify camera feed appears
- [ ] Check object detection bounding boxes appear

### Voice Conversation
- [ ] Speak into microphone
- [ ] Verify interim transcript appears (gray bubble)
- [ ] Verify final transcript appears (solid bubble)
- [ ] Verify ERICA responds with audio
- [ ] Check avatar animates during speaking

### Memory System
- [ ] Have a conversation mentioning personal details
- [ ] Click "New Conversation" button
- [ ] Start another session
- [ ] Verify ERICA remembers previous details

### Voice Selection
- [ ] Try different voices from dropdown
- [ ] Verify voice changes in response

---

## Tab 2: Vision Lens
### Camera
- [ ] Click "Start Camera"
- [ ] Verify video feed appears
- [ ] Click "Stop Camera"

### Object Detection
- [ ] Click "Start Detection"
- [ ] Point camera at objects
- [ ] Verify colored bounding boxes appear
- [ ] Verify labels show (e.g., "person 85%")
- [ ] Check only >70% confidence objects show

### Narration
- [ ] Click "Narration On"
- [ ] Verify audio description of objects
- [ ] Change voice and verify it works
- [ ] Click "Narration Off"

---

## Tab 3: Video Analysis
### Upload
- [ ] Drag and drop video file
- [ ] OR click upload area
- [ ] Verify video preview appears
- [ ] Click X to remove video

### Analysis
- [ ] Upload video
- [ ] Enter question: "What happens in this video?"
- [ ] Click "Analyze Video"
- [ ] Verify progress bar updates
- [ ] Verify analysis appears
- [ ] Test "Stop Analysis" button

---

## Tab 4: Agentic Vision
### Stream Setup
- [ ] Click "Start Camera"
- [ ] Verify camera feed appears
- [ ] OR click "Share Screen"
- [ ] Verify screen share works

### Command Execution
- [ ] Enter command: "Find the search bar"
- [ ] Click "Execute Command"
- [ ] Verify action plan appears
- [ ] Check action steps show sequentially
- [ ] Verify CLICK actions show coordinates
- [ ] Verify purple ring animation on clicks

### Stop
- [ ] Click "Stop Vision"
- [ ] Verify feed stops

---

## Tab 5: Research Agent
### Search
- [ ] Enter query: "Who won the latest F1 race?"
- [ ] Click "Search with Gemini"
- [ ] Verify loading spinner
- [ ] Verify answer appears
- [ ] Check "Sources" section appears
- [ ] Verify source links are clickable

---

## Tab 6: Chat
### Text Chat
- [ ] Type message: "Hello, who are you?"
- [ ] Press Enter or click send
- [ ] Verify streaming response
- [ ] Check conversation history persists

### Image Chat
- [ ] Click paperclip icon
- [ ] Select image file
- [ ] OR drag and drop image
- [ ] Verify image preview
- [ ] Add text: "What's in this image?"
- [ ] Send message
- [ ] Verify AI describes image
- [ ] Click X on preview to remove

---

## Error Handling Tests
### Permissions
- [ ] Deny camera permission → verify error message
- [ ] Deny microphone permission → verify error message

### API Key
- [ ] Test with invalid API_KEY → verify error appears
- [ ] Test with no API_KEY → verify error appears

### Network
- [ ] Disconnect internet → verify error handling
- [ ] Reconnect → verify recovery

---

## Browser Compatibility
### Chrome/Edge
- [ ] All features work
- [ ] Audio playback works
- [ ] Speech recognition works

### Safari
- [ ] Camera access works
- [ ] Microphone access works
- [ ] Check webkit prefixes work

### Firefox
- [ ] All features functional
- [ ] Audio context works

---

## Performance Tests
### Memory Leaks
- [ ] Start/stop camera 10 times
- [ ] Check browser memory usage stable
- [ ] Switch between tabs rapidly
- [ ] Verify no crashes

### Long Sessions
- [ ] Run Interactive mode for 5+ minutes
- [ ] Verify no slowdowns
- [ ] Check localStorage size

---

## Accessibility Tests
### Keyboard Navigation
- [ ] Tab through all buttons
- [ ] Press Enter on upload area
- [ ] Navigate tabs with keyboard

### Screen Reader
- [ ] Enable screen reader
- [ ] Verify ARIA labels read correctly
- [ ] Check live regions announce updates

---

## Production Build Test
- [ ] Run: `npm run build`
- [ ] Check no errors
- [ ] Run: `npm start`
- [ ] Verify all features work from dist/

---

## Pass Criteria
✅ All checkboxes completed without critical errors
✅ Camera and microphone permissions handled gracefully
✅ AI responses are relevant and accurate
✅ No console errors (except expected permission denials)
✅ UI is responsive and animations smooth
✅ Error messages are user-friendly
