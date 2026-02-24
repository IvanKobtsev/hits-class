//-----Types.File-----
export interface ProblemDetails  {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}
export function deserializeProblemDetails(json: string): ProblemDetails {
  const data = JSON.parse(json) as ProblemDetails;
  initProblemDetails(data);
  return data;
}
export function initProblemDetails(_data: ProblemDetails) {
    return _data;
}
export function serializeProblemDetails(_data: ProblemDetails | undefined) {
  if (_data) {
    _data = prepareSerializeProblemDetails(_data as ProblemDetails);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeProblemDetails(_data: ProblemDetails): ProblemDetails {
  const data: Record<string, any> = { ..._data };
  return data as ProblemDetails;
}
export interface HttpValidationProblemDetails extends ProblemDetails  {
  errors: { [key: string]: string[]; };
  [key: string]: any;
}
export function deserializeHttpValidationProblemDetails(json: string): HttpValidationProblemDetails {
  const data = JSON.parse(json) as HttpValidationProblemDetails;
  initHttpValidationProblemDetails(data);
  return data;
}
export function initHttpValidationProblemDetails(_data: HttpValidationProblemDetails) {
  initProblemDetails(_data);
    return _data;
}
export function serializeHttpValidationProblemDetails(_data: HttpValidationProblemDetails | undefined) {
  if (_data) {
    _data = prepareSerializeHttpValidationProblemDetails(_data as HttpValidationProblemDetails);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeHttpValidationProblemDetails(_data: HttpValidationProblemDetails): HttpValidationProblemDetails {
  const data = prepareSerializeProblemDetails(_data as HttpValidationProblemDetails) as Record<string, any>;
  return data as HttpValidationProblemDetails;
}
export interface ValidationProblemDetails extends HttpValidationProblemDetails  {
  errors: { [key: string]: string[]; };
  [key: string]: any;
}
export function deserializeValidationProblemDetails(json: string): ValidationProblemDetails {
  const data = JSON.parse(json) as ValidationProblemDetails;
  initValidationProblemDetails(data);
  return data;
}
export function initValidationProblemDetails(_data: ValidationProblemDetails) {
  initHttpValidationProblemDetails(_data);
    return _data;
}
export function serializeValidationProblemDetails(_data: ValidationProblemDetails | undefined) {
  if (_data) {
    _data = prepareSerializeValidationProblemDetails(_data as ValidationProblemDetails);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeValidationProblemDetails(_data: ValidationProblemDetails): ValidationProblemDetails {
  const data = prepareSerializeHttpValidationProblemDetails(_data as ValidationProblemDetails) as Record<string, any>;
  return data as ValidationProblemDetails;
}
export interface RegisterUserDto  {
  email: string;
  legalName: string;
  groupNumber: string | null;
  password: string;
}
export function deserializeRegisterUserDto(json: string): RegisterUserDto {
  const data = JSON.parse(json) as RegisterUserDto;
  initRegisterUserDto(data);
  return data;
}
export function initRegisterUserDto(_data: RegisterUserDto) {
    return _data;
}
export function serializeRegisterUserDto(_data: RegisterUserDto | undefined) {
  if (_data) {
    _data = prepareSerializeRegisterUserDto(_data as RegisterUserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeRegisterUserDto(_data: RegisterUserDto): RegisterUserDto {
  const data: Record<string, any> = { ..._data };
  return data as RegisterUserDto;
}
export interface UserDto  {
  id: string;
  email: string;
  legalName: string;
  groupNumber: string | null;
}
export function deserializeUserDto(json: string): UserDto {
  const data = JSON.parse(json) as UserDto;
  initUserDto(data);
  return data;
}
export function initUserDto(_data: UserDto) {
    return _data;
}
export function serializeUserDto(_data: UserDto | undefined) {
  if (_data) {
    _data = prepareSerializeUserDto(_data as UserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeUserDto(_data: UserDto): UserDto {
  const data: Record<string, any> = { ..._data };
  return data as UserDto;
}
export interface CurrentUserDto  {
  id: string;
  username: string;
}
export function deserializeCurrentUserDto(json: string): CurrentUserDto {
  const data = JSON.parse(json) as CurrentUserDto;
  initCurrentUserDto(data);
  return data;
}
export function initCurrentUserDto(_data: CurrentUserDto) {
    return _data;
}
export function serializeCurrentUserDto(_data: CurrentUserDto | undefined) {
  if (_data) {
    _data = prepareSerializeCurrentUserDto(_data as CurrentUserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCurrentUserDto(_data: CurrentUserDto): CurrentUserDto {
  const data: Record<string, any> = { ..._data };
  return data as CurrentUserDto;
}
export interface ResetPasswordDto  {
  username: string;
  token: string;
  newPassword: string;
}
export function deserializeResetPasswordDto(json: string): ResetPasswordDto {
  const data = JSON.parse(json) as ResetPasswordDto;
  initResetPasswordDto(data);
  return data;
}
export function initResetPasswordDto(_data: ResetPasswordDto) {
    return _data;
}
export function serializeResetPasswordDto(_data: ResetPasswordDto | undefined) {
  if (_data) {
    _data = prepareSerializeResetPasswordDto(_data as ResetPasswordDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeResetPasswordDto(_data: ResetPasswordDto): ResetPasswordDto {
  const data: Record<string, any> = { ..._data };
  return data as ResetPasswordDto;
}
export interface ChangePasswordDto  {
  oldPassword: string;
  newPassword: string;
}
export function deserializeChangePasswordDto(json: string): ChangePasswordDto {
  const data = JSON.parse(json) as ChangePasswordDto;
  initChangePasswordDto(data);
  return data;
}
export function initChangePasswordDto(_data: ChangePasswordDto) {
    return _data;
}
export function serializeChangePasswordDto(_data: ChangePasswordDto | undefined) {
  if (_data) {
    _data = prepareSerializeChangePasswordDto(_data as ChangePasswordDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeChangePasswordDto(_data: ChangePasswordDto): ChangePasswordDto {
  const data: Record<string, any> = { ..._data };
  return data as ChangePasswordDto;
}
export interface PagedResultOfUserDto  {
  data: UserDto[];
  totalCount: number;
}
export function deserializePagedResultOfUserDto(json: string): PagedResultOfUserDto {
  const data = JSON.parse(json) as PagedResultOfUserDto;
  initPagedResultOfUserDto(data);
  return data;
}
export function initPagedResultOfUserDto(_data: PagedResultOfUserDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initUserDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfUserDto(_data: PagedResultOfUserDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfUserDto(_data as PagedResultOfUserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfUserDto(_data: PagedResultOfUserDto): PagedResultOfUserDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeUserDto(item)
    );
  }
  return data as PagedResultOfUserDto;
}
export enum SortOrder {
    Asc = "Asc",
    Desc = "Desc",
}
export interface SubmissionDto  {
  id: number;
  state: SubmissionState;
  mark: string | null;
  lastSubmittedAtUTC: Date | null;
  lastMarkedAtUTC: Date | null;
  attachments: FileInfoDto[];
  author: UserDto;
  comments: CommentDto[];
}
export function deserializeSubmissionDto(json: string): SubmissionDto {
  const data = JSON.parse(json) as SubmissionDto;
  initSubmissionDto(data);
  return data;
}
export function initSubmissionDto(_data: SubmissionDto) {
  if (_data) {
    _data.state = _data["state"];
    _data.lastSubmittedAtUTC = _data["lastSubmittedAtUTC"] ? new Date(_data["lastSubmittedAtUTC"].toString()) : <any>null;
    _data.lastMarkedAtUTC = _data["lastMarkedAtUTC"] ? new Date(_data["lastMarkedAtUTC"].toString()) : <any>null;
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
    _data.author = _data["author"] && initUserDto(_data["author"]);
    if (Array.isArray(_data["comments"])) {
      _data.comments = _data["comments"].map(item => 
        initCommentDto(item)
      );
    }
  }
  return _data;
}
export function serializeSubmissionDto(_data: SubmissionDto | undefined) {
  if (_data) {
    _data = prepareSerializeSubmissionDto(_data as SubmissionDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeSubmissionDto(_data: SubmissionDto): SubmissionDto {
  const data: Record<string, any> = { ..._data };
  data["lastSubmittedAtUTC"] = _data.lastSubmittedAtUTC && _data.lastSubmittedAtUTC.toISOString();
  data["lastMarkedAtUTC"] = _data.lastMarkedAtUTC && _data.lastMarkedAtUTC.toISOString();
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  if (Array.isArray(_data.comments)) {
    data["comments"] = _data.comments.map(item => 
        prepareSerializeCommentDto(item)
    );
  }
  return data as SubmissionDto;
}
export enum SubmissionState {
    Draft = "Draft",
    Submitted = "Submitted",
    Accepted = "Accepted",
}
export interface FileInfoDto  {
  id: string;
  fileName: string;
  size: number;
  metadata: FileMetadataDto;
  createdAt: Date;
}
export function deserializeFileInfoDto(json: string): FileInfoDto {
  const data = JSON.parse(json) as FileInfoDto;
  initFileInfoDto(data);
  return data;
}
export function initFileInfoDto(_data: FileInfoDto) {
  if (_data) {
    _data.metadata = _data["metadata"] && initFileMetadataDto(_data["metadata"]);
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
  }
  return _data;
}
export function serializeFileInfoDto(_data: FileInfoDto | undefined) {
  if (_data) {
    _data = prepareSerializeFileInfoDto(_data as FileInfoDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeFileInfoDto(_data: FileInfoDto): FileInfoDto {
  const data: Record<string, any> = { ..._data };
  data["metadata"] = _data.metadata && prepareSerializeFileMetadataDto(_data.metadata);
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  return data as FileInfoDto;
}
export interface FileMetadataDto  {
  externalId: string | null;
}
export function deserializeFileMetadataDto(json: string): FileMetadataDto {
  const data = JSON.parse(json) as FileMetadataDto;
  initFileMetadataDto(data);
  return data;
}
export function initFileMetadataDto(_data: FileMetadataDto) {
    return _data;
}
export function serializeFileMetadataDto(_data: FileMetadataDto | undefined) {
  if (_data) {
    _data = prepareSerializeFileMetadataDto(_data as FileMetadataDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeFileMetadataDto(_data: FileMetadataDto): FileMetadataDto {
  const data: Record<string, any> = { ..._data };
  return data as FileMetadataDto;
}
export interface CommentDto  {
  id: number;
  createdAt: Date;
  lastEditedAt: Date | null;
  author: UserDto;
  textLexical: string;
}
export function deserializeCommentDto(json: string): CommentDto {
  const data = JSON.parse(json) as CommentDto;
  initCommentDto(data);
  return data;
}
export function initCommentDto(_data: CommentDto) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
    _data.lastEditedAt = _data["lastEditedAt"] ? new Date(_data["lastEditedAt"].toString()) : <any>null;
    _data.author = _data["author"] && initUserDto(_data["author"]);
  }
  return _data;
}
export function serializeCommentDto(_data: CommentDto | undefined) {
  if (_data) {
    _data = prepareSerializeCommentDto(_data as CommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCommentDto(_data: CommentDto): CommentDto {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  data["lastEditedAt"] = _data.lastEditedAt && _data.lastEditedAt.toISOString();
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  return data as CommentDto;
}
export interface CreateSubmissionDto  {
  attachments: FileInfoDto[];
}
export function deserializeCreateSubmissionDto(json: string): CreateSubmissionDto {
  const data = JSON.parse(json) as CreateSubmissionDto;
  initCreateSubmissionDto(data);
  return data;
}
export function initCreateSubmissionDto(_data: CreateSubmissionDto) {
  if (_data) {
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
  }
  return _data;
}
export function serializeCreateSubmissionDto(_data: CreateSubmissionDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateSubmissionDto(_data as CreateSubmissionDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateSubmissionDto(_data: CreateSubmissionDto): CreateSubmissionDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  return data as CreateSubmissionDto;
}
export interface PagedResultOfSubmissionListItem  {
  data: SubmissionListItem[];
  totalCount: number;
}
export function deserializePagedResultOfSubmissionListItem(json: string): PagedResultOfSubmissionListItem {
  const data = JSON.parse(json) as PagedResultOfSubmissionListItem;
  initPagedResultOfSubmissionListItem(data);
  return data;
}
export function initPagedResultOfSubmissionListItem(_data: PagedResultOfSubmissionListItem) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initSubmissionListItem(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfSubmissionListItem(_data: PagedResultOfSubmissionListItem | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfSubmissionListItem(_data as PagedResultOfSubmissionListItem);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfSubmissionListItem(_data: PagedResultOfSubmissionListItem): PagedResultOfSubmissionListItem {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeSubmissionListItem(item)
    );
  }
  return data as PagedResultOfSubmissionListItem;
}
export interface SubmissionListItem  {
  id: number;
  state: SubmissionState;
  mark: string | null;
  author: UserDto;
}
export function deserializeSubmissionListItem(json: string): SubmissionListItem {
  const data = JSON.parse(json) as SubmissionListItem;
  initSubmissionListItem(data);
  return data;
}
export function initSubmissionListItem(_data: SubmissionListItem) {
  if (_data) {
    _data.state = _data["state"];
    _data.author = _data["author"] && initUserDto(_data["author"]);
  }
  return _data;
}
export function serializeSubmissionListItem(_data: SubmissionListItem | undefined) {
  if (_data) {
    _data = prepareSerializeSubmissionListItem(_data as SubmissionListItem);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeSubmissionListItem(_data: SubmissionListItem): SubmissionListItem {
  const data: Record<string, any> = { ..._data };
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  return data as SubmissionListItem;
}
export interface MarkDto  {
  mark: string | null;
  markComment: string | null;
}
export function deserializeMarkDto(json: string): MarkDto {
  const data = JSON.parse(json) as MarkDto;
  initMarkDto(data);
  return data;
}
export function initMarkDto(_data: MarkDto) {
    return _data;
}
export function serializeMarkDto(_data: MarkDto | undefined) {
  if (_data) {
    _data = prepareSerializeMarkDto(_data as MarkDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeMarkDto(_data: MarkDto): MarkDto {
  const data: Record<string, any> = { ..._data };
  return data as MarkDto;
}
export interface PagedResultOfCourseListItemDto  {
  data: CourseListItemDto[];
  totalCount: number;
}
export function deserializePagedResultOfCourseListItemDto(json: string): PagedResultOfCourseListItemDto {
  const data = JSON.parse(json) as PagedResultOfCourseListItemDto;
  initPagedResultOfCourseListItemDto(data);
  return data;
}
export function initPagedResultOfCourseListItemDto(_data: PagedResultOfCourseListItemDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initCourseListItemDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfCourseListItemDto(_data: PagedResultOfCourseListItemDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfCourseListItemDto(_data as PagedResultOfCourseListItemDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfCourseListItemDto(_data: PagedResultOfCourseListItemDto): PagedResultOfCourseListItemDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeCourseListItemDto(item)
    );
  }
  return data as PagedResultOfCourseListItemDto;
}
export interface CourseListItemDto  {
  id: number;
  createdAt: Date;
  title: string;
  description: string;
}
export function deserializeCourseListItemDto(json: string): CourseListItemDto {
  const data = JSON.parse(json) as CourseListItemDto;
  initCourseListItemDto(data);
  return data;
}
export function initCourseListItemDto(_data: CourseListItemDto) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
  }
  return _data;
}
export function serializeCourseListItemDto(_data: CourseListItemDto | undefined) {
  if (_data) {
    _data = prepareSerializeCourseListItemDto(_data as CourseListItemDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCourseListItemDto(_data: CourseListItemDto): CourseListItemDto {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  return data as CourseListItemDto;
}
export interface CourseDto  {
  id: number;
  createdAt: Date;
  owner: UserDto;
  teachers: UserDto[];
  inviteCode: string;
  title: string;
  description: string;
}
export function deserializeCourseDto(json: string): CourseDto {
  const data = JSON.parse(json) as CourseDto;
  initCourseDto(data);
  return data;
}
export function initCourseDto(_data: CourseDto) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
    _data.owner = _data["owner"] && initUserDto(_data["owner"]);
    if (Array.isArray(_data["teachers"])) {
      _data.teachers = _data["teachers"].map(item => 
        initUserDto(item)
      );
    }
  }
  return _data;
}
export function serializeCourseDto(_data: CourseDto | undefined) {
  if (_data) {
    _data = prepareSerializeCourseDto(_data as CourseDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCourseDto(_data: CourseDto): CourseDto {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  data["owner"] = _data.owner && prepareSerializeUserDto(_data.owner);
  if (Array.isArray(_data.teachers)) {
    data["teachers"] = _data.teachers.map(item => 
        prepareSerializeUserDto(item)
    );
  }
  return data as CourseDto;
}
export interface PagedResultOfCourseMemberDto  {
  data: CourseMemberDto[];
  totalCount: number;
}
export function deserializePagedResultOfCourseMemberDto(json: string): PagedResultOfCourseMemberDto {
  const data = JSON.parse(json) as PagedResultOfCourseMemberDto;
  initPagedResultOfCourseMemberDto(data);
  return data;
}
export function initPagedResultOfCourseMemberDto(_data: PagedResultOfCourseMemberDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initCourseMemberDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfCourseMemberDto(_data: PagedResultOfCourseMemberDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfCourseMemberDto(_data as PagedResultOfCourseMemberDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfCourseMemberDto(_data: PagedResultOfCourseMemberDto): PagedResultOfCourseMemberDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeCourseMemberDto(item)
    );
  }
  return data as PagedResultOfCourseMemberDto;
}
export interface CourseMemberDto  {
  id: string;
  email: string;
  legalName: string;
  groupNumber: string | null;
  isTeacher: boolean;
  isOwner: boolean;
}
export function deserializeCourseMemberDto(json: string): CourseMemberDto {
  const data = JSON.parse(json) as CourseMemberDto;
  initCourseMemberDto(data);
  return data;
}
export function initCourseMemberDto(_data: CourseMemberDto) {
    return _data;
}
export function serializeCourseMemberDto(_data: CourseMemberDto | undefined) {
  if (_data) {
    _data = prepareSerializeCourseMemberDto(_data as CourseMemberDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCourseMemberDto(_data: CourseMemberDto): CourseMemberDto {
  const data: Record<string, any> = { ..._data };
  return data as CourseMemberDto;
}
export interface CreateCourseDto  {
  title: string;
  description: string;
}
export function deserializeCreateCourseDto(json: string): CreateCourseDto {
  const data = JSON.parse(json) as CreateCourseDto;
  initCreateCourseDto(data);
  return data;
}
export function initCreateCourseDto(_data: CreateCourseDto) {
    return _data;
}
export function serializeCreateCourseDto(_data: CreateCourseDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateCourseDto(_data as CreateCourseDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateCourseDto(_data: CreateCourseDto): CreateCourseDto {
  const data: Record<string, any> = { ..._data };
  return data as CreateCourseDto;
}
export interface PatchCourseDto  {
  title: string;
  description: string;
}
export function deserializePatchCourseDto(json: string): PatchCourseDto {
  const data = JSON.parse(json) as PatchCourseDto;
  initPatchCourseDto(data);
  return data;
}
export function initPatchCourseDto(_data: PatchCourseDto) {
    return _data;
}
export function serializePatchCourseDto(_data: PatchCourseDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchCourseDto(_data as PatchCourseDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchCourseDto(_data: PatchCourseDto): PatchCourseDto {
  const data: Record<string, any> = { ..._data };
  return data as PatchCourseDto;
}
export interface PagedResultOfCommentDto  {
  data: CommentDto[];
  totalCount: number;
}
export function deserializePagedResultOfCommentDto(json: string): PagedResultOfCommentDto {
  const data = JSON.parse(json) as PagedResultOfCommentDto;
  initPagedResultOfCommentDto(data);
  return data;
}
export function initPagedResultOfCommentDto(_data: PagedResultOfCommentDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initCommentDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfCommentDto(_data: PagedResultOfCommentDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfCommentDto(_data as PagedResultOfCommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfCommentDto(_data: PagedResultOfCommentDto): PagedResultOfCommentDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeCommentDto(item)
    );
  }
  return data as PagedResultOfCommentDto;
}
export interface CreateCommentDto  {
  textLexical: string;
}
export function deserializeCreateCommentDto(json: string): CreateCommentDto {
  const data = JSON.parse(json) as CreateCommentDto;
  initCreateCommentDto(data);
  return data;
}
export function initCreateCommentDto(_data: CreateCommentDto) {
    return _data;
}
export function serializeCreateCommentDto(_data: CreateCommentDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateCommentDto(_data as CreateCommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateCommentDto(_data: CreateCommentDto): CreateCommentDto {
  const data: Record<string, any> = { ..._data };
  return data as CreateCommentDto;
}
export interface PatchCommentDto  {
  textLexical: string;
}
export function deserializePatchCommentDto(json: string): PatchCommentDto {
  const data = JSON.parse(json) as PatchCommentDto;
  initPatchCommentDto(data);
  return data;
}
export function initPatchCommentDto(_data: PatchCommentDto) {
    return _data;
}
export function serializePatchCommentDto(_data: PatchCommentDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchCommentDto(_data as PatchCommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchCommentDto(_data: PatchCommentDto): PatchCommentDto {
  const data: Record<string, any> = { ..._data };
  return data as PatchCommentDto;
}
export interface AssignmentDto  {
  id: number;
  title: string;
  description: string | null;
  author: UserDto;
  deadlineUTC: Date | null;
  createdAtUTC: Date;
  lastUpdatedAtUTC: Date | null;
  attachments: FileInfoDto[];
  comments: CommentDto[];
}
export function deserializeAssignmentDto(json: string): AssignmentDto {
  const data = JSON.parse(json) as AssignmentDto;
  initAssignmentDto(data);
  return data;
}
export function initAssignmentDto(_data: AssignmentDto) {
  if (_data) {
    _data.author = _data["author"] && initUserDto(_data["author"]);
    _data.deadlineUTC = _data["deadlineUTC"] ? new Date(_data["deadlineUTC"].toString()) : <any>null;
    _data.createdAtUTC = _data["createdAtUTC"] ? new Date(_data["createdAtUTC"].toString()) : <any>null;
    _data.lastUpdatedAtUTC = _data["lastUpdatedAtUTC"] ? new Date(_data["lastUpdatedAtUTC"].toString()) : <any>null;
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
    if (Array.isArray(_data["comments"])) {
      _data.comments = _data["comments"].map(item => 
        initCommentDto(item)
      );
    }
  }
  return _data;
}
export function serializeAssignmentDto(_data: AssignmentDto | undefined) {
  if (_data) {
    _data = prepareSerializeAssignmentDto(_data as AssignmentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAssignmentDto(_data: AssignmentDto): AssignmentDto {
  const data: Record<string, any> = { ..._data };
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  data["deadlineUTC"] = _data.deadlineUTC && _data.deadlineUTC.toISOString();
  data["createdAtUTC"] = _data.createdAtUTC && _data.createdAtUTC.toISOString();
  data["lastUpdatedAtUTC"] = _data.lastUpdatedAtUTC && _data.lastUpdatedAtUTC.toISOString();
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  if (Array.isArray(_data.comments)) {
    data["comments"] = _data.comments.map(item => 
        prepareSerializeCommentDto(item)
    );
  }
  return data as AssignmentDto;
}
export interface AssignmentStatisticDto  {
  submitted: number;
  notSubmitted: number;
  marked: number;
  total: number;
}
export function deserializeAssignmentStatisticDto(json: string): AssignmentStatisticDto {
  const data = JSON.parse(json) as AssignmentStatisticDto;
  initAssignmentStatisticDto(data);
  return data;
}
export function initAssignmentStatisticDto(_data: AssignmentStatisticDto) {
    return _data;
}
export function serializeAssignmentStatisticDto(_data: AssignmentStatisticDto | undefined) {
  if (_data) {
    _data = prepareSerializeAssignmentStatisticDto(_data as AssignmentStatisticDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAssignmentStatisticDto(_data: AssignmentStatisticDto): AssignmentStatisticDto {
  const data: Record<string, any> = { ..._data };
  return data as AssignmentStatisticDto;
}
export interface CreateAssignmentDto  {
  title: string;
  description: string | null;
  deadlineUTC: Date | null;
  attachments: FileInfoDto[];
}
export function deserializeCreateAssignmentDto(json: string): CreateAssignmentDto {
  const data = JSON.parse(json) as CreateAssignmentDto;
  initCreateAssignmentDto(data);
  return data;
}
export function initCreateAssignmentDto(_data: CreateAssignmentDto) {
  if (_data) {
    _data.deadlineUTC = _data["deadlineUTC"] ? new Date(_data["deadlineUTC"].toString()) : <any>null;
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
  }
  return _data;
}
export function serializeCreateAssignmentDto(_data: CreateAssignmentDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateAssignmentDto(_data as CreateAssignmentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateAssignmentDto(_data: CreateAssignmentDto): CreateAssignmentDto {
  const data: Record<string, any> = { ..._data };
  data["deadlineUTC"] = _data.deadlineUTC && _data.deadlineUTC.toISOString();
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  return data as CreateAssignmentDto;
}
export interface AnnouncementDto  {
  id: number;
  title: string;
  description: string | null;
  author: UserDto;
  createdAtUTC: Date;
  lastUpdatedAtUTC: Date | null;
  attachments: FileInfoDto[];
  comments: CommentDto[];
}
export function deserializeAnnouncementDto(json: string): AnnouncementDto {
  const data = JSON.parse(json) as AnnouncementDto;
  initAnnouncementDto(data);
  return data;
}
export function initAnnouncementDto(_data: AnnouncementDto) {
  if (_data) {
    _data.author = _data["author"] && initUserDto(_data["author"]);
    _data.createdAtUTC = _data["createdAtUTC"] ? new Date(_data["createdAtUTC"].toString()) : <any>null;
    _data.lastUpdatedAtUTC = _data["lastUpdatedAtUTC"] ? new Date(_data["lastUpdatedAtUTC"].toString()) : <any>null;
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
    if (Array.isArray(_data["comments"])) {
      _data.comments = _data["comments"].map(item => 
        initCommentDto(item)
      );
    }
  }
  return _data;
}
export function serializeAnnouncementDto(_data: AnnouncementDto | undefined) {
  if (_data) {
    _data = prepareSerializeAnnouncementDto(_data as AnnouncementDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAnnouncementDto(_data: AnnouncementDto): AnnouncementDto {
  const data: Record<string, any> = { ..._data };
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  data["createdAtUTC"] = _data.createdAtUTC && _data.createdAtUTC.toISOString();
  data["lastUpdatedAtUTC"] = _data.lastUpdatedAtUTC && _data.lastUpdatedAtUTC.toISOString();
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  if (Array.isArray(_data.comments)) {
    data["comments"] = _data.comments.map(item => 
        prepareSerializeCommentDto(item)
    );
  }
  return data as AnnouncementDto;
}
export interface CreateAnnouncementDto  {
  title: string;
  description: string | null;
  attachments: FileInfoDto[];
}
export function deserializeCreateAnnouncementDto(json: string): CreateAnnouncementDto {
  const data = JSON.parse(json) as CreateAnnouncementDto;
  initCreateAnnouncementDto(data);
  return data;
}
export function initCreateAnnouncementDto(_data: CreateAnnouncementDto) {
  if (_data) {
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
  }
  return _data;
}
export function serializeCreateAnnouncementDto(_data: CreateAnnouncementDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateAnnouncementDto(_data as CreateAnnouncementDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateAnnouncementDto(_data: CreateAnnouncementDto): CreateAnnouncementDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  return data as CreateAnnouncementDto;
}
import type { AxiosError } from 'axios'
export interface FileParameter {
    data: any;
    fileName: string;
}
export interface FileResponse {
    data: Blob;
    status: number;
    fileName?: string;
    headers?: { [name: string]: any };
}
export class ApiException extends Error {
    message: string;
    status: number;
    response: string;
    headers: { [key: string]: any; };
    result: any;
    constructor(message: string, status: number, response: string, headers: { [key: string]: any; }, result: any) {
        super();
        this.message = message;
        this.status = status;
        this.response = response;
        this.headers = headers;
        this.result = result;
    }
    protected isApiException = true;
    static isApiException(obj: any): obj is ApiException {
        return obj.isApiException === true;
    }
}
export function throwException(message: string, status: number, response: string, headers: { [key: string]: any; }, result?: any): any {
    if (result !== null && result !== undefined)
        throw result;
    else
        throw new ApiException(message, status, response, headers, null);
}
export function isAxiosError(obj: any | undefined): obj is AxiosError {
    return obj && obj.isAxiosError === true;
}
//-----/Types.File-----