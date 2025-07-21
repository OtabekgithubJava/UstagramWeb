import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { PostServiceService } from '../../services/post-service.service';
import { UserServiceService } from '../../services/user-service.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { FavoritesService } from '../../services/favourite-service.service';
import { Post } from '../../interfaces/post';
import { User } from '../../interfaces/user';
import { Router, ActivatedRoute } from '@angular/router';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Comment } from '../../interfaces/comment';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: (Post & { isLiked?: boolean; isFavourited?: boolean; randomPhoto?: string; isFavouriteLoading?: boolean })[] = [];
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
  stories: any[] = [];
  storyViewerVisible = false;
  activeStoryIndex = 0;
  progress = 0;
  storyInterval: any;
  storyPaused = false;

  private destroy$ = new Subject<void>();
  private currentPage = 1;
  private postsPerPage = 5;
  private isFetching = false;
  private hasMorePosts = true;
  private userFavorites: string[] = [];
  private scrollListener: () => void;
  
  private photoList: string[] = [
    'p1.jpeg', 'p2.jpeg', 'p3.jpeg', 'p4.jpeg', 'p5.jpeg',
    'p6.jpeg', 'p7.jpeg', 'p8.jpeg', 'p9.jpeg', 'p10.jpeg',
    'p11.jpeg', 'p12.jpeg', 'p13.jpeg', 'p14.jpeg', 'p15.jpeg'
  ];

  constructor(
    private postService: PostServiceService,
    private userService: UserServiceService,
    private authService: AuthServiceService,
    private favouriteService: FavoritesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.scrollListener = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        this.loadPosts();
      }
    };
  }

  ngOnInit(): void {
    this.checkViewport();
    this.loadInitialData();
    this.setupScrollListener();
    this.generateStoryPhotos();
    this.generateStories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearStoryProgress();
    window.removeEventListener('scroll', this.scrollListener);
  }

  generateStories(): void {
    this.stories = Array(10).fill(null).map((_, i) => ({
      user: {
        username: ``,
        photoPath: this.getRandomPhoto(),
        fullName: ``
      },
      image: this.getRandomPhoto(),
      time: this.getRandomTime(),
      viewed: false
    }));
  }

  getRandomTime(): string {
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.floor(Math.random() * 60);
    const ampm = Math.random() > 0.5 ? 'AM' : 'PM';
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  }

  openStoryViewer(index: number): void {
    this.activeStoryIndex = index;
    this.storyViewerVisible = true;
    this.stories[index].viewed = true;
    this.startStoryProgress();
    document.body.style.overflow = 'hidden';
  }

  closeStoryViewer(): void {
    this.storyViewerVisible = false;
    this.clearStoryProgress();
    document.body.style.overflow = '';
  }

  startStoryProgress(): void {
    this.progress = 0;
    this.storyPaused = false;
    
    this.storyInterval = setInterval(() => {
      if (!this.storyPaused) {
        this.progress += 1;
        
        if (this.progress >= 100) {
          this.nextStory();
        }
      }
    }, 100);
  }

  clearStoryProgress(): void {
    if (this.storyInterval) {
      clearInterval(this.storyInterval);
      this.storyInterval = null;
    }
  }

  nextStory(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    
    if (this.activeStoryIndex < this.stories.length - 1) {
      this.activeStoryIndex++;
      this.progress = 0;
      this.stories[this.activeStoryIndex].viewed = true;
    } else {
      this.closeStoryViewer();
    }
  }

  prevStory(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    
    if (this.activeStoryIndex > 0) {
      this.activeStoryIndex--;
      this.progress = 0;
    }
  }

  pauseStory(): void {
    this.storyPaused = true;
  }

  resumeStory(): void {
    this.storyPaused = false;
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

  private async loadUserFavorites(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const favorites = await lastValueFrom(
        this.favouriteService.getFavoritesByUser().pipe(takeUntil(this.destroy$))
      );
      this.userFavorites = favorites.map(fav => fav.postId);
    } catch (err) {
      console.error('Error loading favorites:', err);
      this.userFavorites = [];
    }
  }

  private isPostFavorited(postId: string): boolean {
    return this.userFavorites.includes(postId);
  }

  private async checkFavoriteStatus(posts: Post[]): Promise<(Post & { isFavourited?: boolean })[]> {
    return posts.map(post => ({
      ...post,
      isFavourited: this.isPostFavorited(post.id)
    }));
  }

  async loadInitialData(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = await lastValueFrom(
        this.userService.getUserById(userId).pipe(takeUntil(this.destroy$))
      );
      this.currentUser = user;
      await this.loadUserFavorites();

      const username = this.route.snapshot.paramMap.get('username');
      if (username) {
        await this.loadUserProfile(username);
      } else {
        await this.loadPosts();
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      this.errorMessage = 'Failed to load data';
      this.isLoading = false;
    }
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

  async loadUserProfile(username: string): Promise<void> {
    this.showUserProfile = true;
    this.isLoading = true;

    try {
      const user = await lastValueFrom(
        this.userService.getUserByUsername(username).pipe(takeUntil(this.destroy$))
      );
      
      if (!user) {
        this.errorMessage = 'User not found';
        this.router.navigate(['/feed']);
        return;
      }
      
      this.viewedUser = user;
      await this.loadUserPosts(user.id);
    } catch (err) {
      console.error('Error loading user profile:', err);
      this.errorMessage = 'Could not load user profile';
      this.router.navigate(['/feed']);
    } finally {
      this.isLoading = false;
    }
  }

  toggleFavorite(post: Post & { isFavourited?: boolean; isFavouriteLoading?: boolean }): void {
    if (!this.currentUser || post.isFavouriteLoading) return;

    post.isFavouriteLoading = true;
    const wasFavorited = post.isFavourited;

    post.isFavourited = !wasFavorited;
    if (post.isFavourited) {
      this.userFavorites.push(post.id);
    } else {
      this.userFavorites = this.userFavorites.filter(id => id !== post.id);
    }

    const action$ = wasFavorited 
      ? this.favouriteService.deleteFavorite(post.id)
      : this.favouriteService.createFavorite(post.id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        post.isFavouriteLoading = false;
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
        post.isFavourited = wasFavorited;
        if (wasFavorited) {
          this.userFavorites.push(post.id);
        } else {
          this.userFavorites = this.userFavorites.filter(id => id !== post.id);
        }
        post.isFavouriteLoading = false;
      }
    });
  }

  async loadPosts(): Promise<void> {
    if (this.isFetching || !this.hasMorePosts) return;

    this.isFetching = true;
    try {
      const posts = await lastValueFrom(
        this.postService.getAllPosts().pipe(takeUntil(this.destroy$))
      );
      
      if (posts && posts.length === 0) {
        this.hasMorePosts = false;
      } else if (posts) {
        const postsWithStatus = await this.checkFavoriteStatus(posts);
        this.posts = [...this.posts, ...postsWithStatus.map(post => ({ 
          ...post, 
          isLiked: false,
          randomPhoto: this.getRandomPhoto(),
          isFavouriteLoading: false
        }))];
        this.currentPage++;
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      this.errorMessage = 'Could not load posts';
    } finally {
      this.isLoading = false;
      this.isFetching = false;
    }
  }

  async loadUserPosts(userId: string): Promise<void> {
    this.isLoading = true;
    try {
      const posts = await lastValueFrom(
        this.postService.getPostsByUserId(userId).pipe(takeUntil(this.destroy$))
      );
      
      if (posts) {
        const postsWithStatus = await this.checkFavoriteStatus(posts);
        this.posts = postsWithStatus.map(post => ({ 
          ...post, 
          isLiked: false,
          randomPhoto: this.getRandomPhoto(),
          isFavouriteLoading: false
        }));
      }
    } catch (err) {
      console.error('Error loading user posts:', err);
      this.errorMessage = 'Could not load user posts';
    } finally {
      this.isLoading = false;
    }
  }

  setupScrollListener(): void {
    if (!this.showUserProfile) {
      window.addEventListener('scroll', this.scrollListener);
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
}