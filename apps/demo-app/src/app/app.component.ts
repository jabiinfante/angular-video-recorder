import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VideoRecorderComponent } from 'video-recorder';

@Component({
  standalone: true,
  imports: [VideoRecorderComponent],
  selector: 'app-root',
  template: `
    <h1>Video Recorder demo app</h1>

    <video-recorder 
      #recorder 
      (fileCreated)="newFile($event)"
    />

    <button (click)="recorder.startRecording()">START RECORDING</button>
    <button (click)="recorder.stopRecording()">STOP RECORDING</button>
    @if(link()) {
      <a [href]="link()" target="_blank">Download created file</a>
    }
  `
  ,
  styles: `
  
  :host {

  }`,
})
export class AppComponent {
  title = 'demo-app';

  link = signal<string>('');

  newFile(f: File) {
    console.log(f);
    this.link.set(URL.createObjectURL(f));

  }
}
