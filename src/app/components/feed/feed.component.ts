import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { PostServiceService } from '../../services/post-service.service';
import { UserServiceService } from '../../services/user-service.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { FavoritesService } from '../../services/favourite-service.service';
import { Post } from '../../interfaces/post';
import { User } from '../../interfaces/user';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Comment } from '../../interfaces/comment';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: (Post & { isLiked?: boolean; isFavourited?: boolean; randomPhoto?: string })[] = [];
  currentUser: User | null = null;
  viewedUser: User | null = null;
  isLoading = true;
  errorMessage = '';
  selectedPost: Post | null = null; 
  isMobileView = false;
  showUserProfile = false;
  storyPhotos: string[] = [];
  selectedStory: string | null = null;
  storyModalVisible = false;

  
  private destroy$ = new Subject<void>();
  private currentPage = 1;
  private postsPerPage = 5;
  private isFetching = false;
  private hasMorePosts = true;
  
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
    private postService: PostServiceService,
    private userService: UserServiceService,
    private authService: AuthServiceService,
    private favouriteService: FavoritesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkViewport();
    this.loadInitialData();
    this.setupScrollListener();
    this.generateStoryPhotos();
  }

  private getRandomPhoto(): string {
    const randomIndex = Math.floor(Math.random() * this.photoList.length);
    return this.photoList[randomIndex];
  }

  private generateStoryPhotos(): void {
    this.storyPhotos = Array(10).fill(null).map(() => this.getRandomPhoto());
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkViewport();
  }

  checkViewport(): void {
    this.isMobileView = window.innerWidth < 768;
  }

  loadInitialData(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUserById(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => this.currentUser = user,
      error: (err) => console.error('Error loading user:', err)
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.loadUserProfile(username);
      } else {
        this.loadPosts();
      }
    });
  }

  openStoryModal(photo: string): void {
    this.selectedStory = photo;
    this.storyModalVisible = true;
    document.body.style.overflow = 'hidden'; 
  }

  closeStoryModal(): void {
    this.selectedStory = null;
    this.storyModalVisible = false;
    document.body.style.overflow = ''; 
  }

  @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(event: KeyboardEvent) {
      if (this.storyModalVisible) {
        this.closeStoryModal();
      }
    }

  loadUserProfile(username: string): void {
    this.showUserProfile = true;
    this.isLoading = true;

    this.userService.getUserByUsername(username).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.viewedUser = user;
        this.loadUserPosts(user.id);
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.errorMessage = 'Could not load user profile';
        this.isLoading = false;
      }
    });
  }

  loadUserPosts(userId: string): void {
    this.postService.getPostsByUserId(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (posts) => {
        this.posts = posts.map(post => ({ 
          ...post, 
          isLiked: false, 
          isFavourited: false,
          randomPhoto: this.getRandomPhoto()
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user posts:', err);
        this.errorMessage = 'Could not load user posts';
        this.isLoading = false;
      }
    });
  }

  loadPosts(): void {
    if (this.isFetching || !this.hasMorePosts) return;

    this.isFetching = true;
    this.postService.getAllPosts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (posts) => {
        if (posts.length === 0) {
          this.hasMorePosts = false;
        } else {
          this.posts = [...this.posts, ...posts.map(post => ({ 
            ...post, 
            isLiked: false, 
            isFavourited: false,
            randomPhoto: this.getRandomPhoto()
          }))];
          this.currentPage++;
        }
        this.isLoading = false;
        this.isFetching = false;
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.errorMessage = 'Could not load posts';
        this.isLoading = false;
        this.isFetching = false;
      }
    });
  }

  setupScrollListener(): void {
    if (!this.showUserProfile) {
      window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
          this.loadPosts();
        }
      });
    }
  }

  openPostModal(post: Post): void {
    this.selectedPost = {
      ...post,
      comments: post.comments ? [...post.comments] : [] 
    };
  }

  closeModal(): void {
    this.selectedPost = null;
  }

  toggleLike(post: Post): void {
    post.likes = (post.likes || 0) + ((post as any).isLiked ? -1 : 1);
    (post as any).isLiked = !(post as any).isLiked;
    this.postService.editPost(post).subscribe();
  }

  navigateToUserProfile(username: string): void {
    this.router.navigate(['/user', username]);
  }

  backToFeed(): void {
    this.showUserProfile = false;
    this.viewedUser = null;
    this.router.navigate(['/feed']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('scroll', () => {});
  }
}