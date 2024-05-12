import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { VideoRecordingError } from './models';
@Component({
  selector: 'video-recorder',
  standalone: true,
  imports: [],
  template: `<video
    #viewer
    [playsInline]="true"
    (loadedmetadata)="viewer.play()"
  ></video>`,
  styles: ``,
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoRecorderComponent implements OnInit {
  preferredCam = input<'front' | 'rear'>('front');
  maxSecondsPerVideo = input<number>(-1);
  maxMBPerVideo = input<number>(-1);

  tourchAvailable = output<boolean>();
  error = output<VideoRecordingError>();
  fileCreated = output<File>();

  video = viewChild.required<ElementRef<HTMLVideoElement>>('viewer');

  private stream = signal<MediaStream | undefined>(undefined);
  private recorder!: MediaRecorder;
  private videoFile!: File;
  private recordedChunks: Blob[] = [];

  private recording = false;
  private videoMimeTypes: string[] = [
    'video/webm',
    'video/mpeg',
    'video/mp4',
    'video/ogg',
    'video/quicktime',
  ];
  constructor() {
    effect(() => {
      const stream = this.stream();
      const vid = this.video();
      if (stream && vid) {
        vid.nativeElement.srcObject = stream;
      }
    });
  }

  ngOnInit(): void {
    if (!('mediaDevices' in window.navigator)) {
      this.error.emit('no_media_devices');
    }

    this._initVideo();
  }

  startRecording() {
    const stream = this.stream();
    if (stream === undefined) {
      this.error.emit('stream_not_ready');
      return;
    }

    this.recording = true;
    this.recordedChunks = [];

    const recordableMimeType = this.videoMimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    );

    // this.recorder = new MediaRecorder(this.stream, {mimeType: this.recordableMimeType});
    this.recorder = new MediaRecorder(stream, {
      mimeType: recordableMimeType,
    });

    this.recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size > 0) {
        this.recordedChunks.push(event.data);
        const blob = new Blob(this.recordedChunks, {
          type: recordableMimeType,
        });

        this.videoFile = new File([blob], crypto.randomUUID(), {
          type: recordableMimeType,
        });
        // console.log(this.recordedVideoFile.size)

        //this.recordedVideoUrl = URL.createObjectURL(this.recordedVideoFile);

        // this.playVideo.nativeElement.src = this.recordedVideoUrl;
        // this.sizeVideoByMB = (this.recordedVideoFile.size / (1024*1024)).toFixed(2)
        // if(this.recordedVideoFile.size >10485760 && this.recordedVideoFile.size < 20971520) {
        //   console.log('video can not 100MB PLS')
        //   this.isMsg =true;
        // }
        // if(this.recordedVideoFile.size >20971520) {
        //   this.onStopRecording()
        //   console.log('overflow 100MB')
        //   console.log(this.recordedVideoUrl)
        //   console.log(this.recordedVideoFile)
        // }
        if (this.recording === false) {
          this.fileCreated.emit(this.videoFile);
        }
      }
    });

    this.recorder.start(1000);
    // this.clickReset();
    // this.isRunning = false
    // this.clickHandler();
    // this.isMsg =false;
  }

  stopRecording() {
    const stream = this.stream();
    if (stream) {
      this.recorder.stop();
      //  stream.getTracks().forEach((track) => track.stop());
    }
    this.recording = false;
  }

  private async _initVideo() {
    const videoConstrains =
      this.preferredCam() === 'rear'
        ? { facingMode: { exact: 'environment' } }
        : {
            width: 360,
            height: 480,
          };
    console.log({
      video: videoConstrains,
    });
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstrains,
    });
    // const track = stream.getVideoTracks()[0];
    // this.tourchAvailable.emit('torch' in track.getCapabilities());
    this.stream.set(stream);
    console.log('sream set');
  }
}
