import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Post } from '../../interfaces/post';
import { Comment, CommentDTO } from '../../interfaces/comment';
import { User } from '../../interfaces/user';
import { CommentServiceService } from '../../services/comment-service.service';
import { PostServiceService } from '../../services/post-service.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class PostModalComponent {
  @Input() post: Post | null = null;
  @Input() user: User | null = null;
  @Output() close = new EventEmitter<void>();
  @ViewChild('commentInput') commentInput!: ElementRef;
  showCommentsModal = false;
  randomPhoto: string = '';

  isMobile: boolean = window.innerWidth < 768;

  private photoList: string[] = [
    'p1.jpeg',
    'p2.jpeg',
    'p3.jpeg',
    'p4.jpeg',
    'p5.jpeg',
    'p6.jpeg',
    'p7.jpeg',
    'p8.jpeg',
    'p9.jpeg',
    'p10.jpeg',
    'p11.jpeg',
    'p12.jpeg',
    'p13.jpeg',
    'p14.jpeg',
    'p15.jpeg',
  ];

  constructor(
    private commentService: CommentServiceService,
    private postService: PostServiceService
  ) {}

  ngOnInit() {
    if (this.post) {
      this.randomPhoto = this.getRandomPhoto();
    }
  }

  private getRandomPhoto(): string {
    const randomIndex = Math.floor(Math.random() * this.photoList.length);
    return this.photoList[randomIndex];
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isMobile = window.innerWidth < 768;
  }

  closeModal(): void {
    this.close.emit();
    document.body.style.overflow = 'auto';
  }

  toggleCommentsModal(): void {
    this.showCommentsModal = !this.showCommentsModal;
  }

  likePost(): void {
    if (!this.post) return;
    this.post.likes = (this.post.likes || 0) + 1;
    this.postService.editPost(this.post).subscribe();
  }

  focusCommentInput(): void {
    this.commentInput.nativeElement.focus();
  }

  addComment(commentText: string): void {
    if (!commentText || !this.post || !this.user) return;

    const commentDto: CommentDTO = {
      content: commentText,
      postId: this.post.id
    };

    this.commentService.addComment(commentDto).subscribe({
      next: (commentId) => {
        if (this.post) {
          const newComment: Comment = {
            id: commentId,
            content: commentText,
            date: new Date().toISOString(),
            userId: this.user!.id,
            user: this.user!,
            postId: this.post!.id,
            post: this.post
          };

          if (!this.post.comments) this.post.comments = [];
          this.post.comments.push(newComment);
          this.commentInput.nativeElement.value = '';
        }
      },
      error: (err) => console.error('Failed to add comment:', err)
    });
  }
}